const Product = require('../models/Product');
const fs      = require('fs');
const path    = require('path');

// GET /api/products
async function getProducts(req, res) {
  try {
    const { search = '', category = '', page = 1, limit = 12 } = req.query;
    const result = await Product.getAll({
      search,
      category,
      page:  parseInt(page),
      limit: parseInt(limit),
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// GET /api/products/categories
async function getCategories(req, res) {
  try {
    const categories = await Product.getCategories();
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// GET /api/products/:id
async function getProduct(req, res) {
  try {
    const product = await Product.getById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// GET /api/products/seller/:sellerId
async function getSellerProducts(req, res) {
  try {
    const products = await Product.getBySellerId(req.params.sellerId);
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/products
async function createProduct(req, res) {
  try {
    const { category_id, title, description, price, size, stock, item_condition } = req.body;

    if (!category_id || !title || !description || !price) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'กรุณาอัปโหลดรูปภาพสินค้าอย่างน้อย 1 รูป' });
    }

    const image = JSON.stringify(req.files.map(f => f.filename));
    const id    = await Product.create({
      seller_id: req.user.id,
      category_id,
      title,
      description,
      price: parseFloat(price),
      size,
      stock: stock ? parseInt(stock) : 1,
      item_condition,
      image,
    });

    const product = await Product.getById(id);
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// PUT /api/products/:id
async function updateProduct(req, res) {
  try {
    const product = await Product.getById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { category_id, title, description, price, size, stock, status, item_condition } = req.body;
    const image = (req.files && req.files.length > 0) ? JSON.stringify(req.files.map(f => f.filename)) : undefined;

    if (image && product.image) {
      let oldImages = [];
      try { oldImages = JSON.parse(product.image); } catch(e) { oldImages = [product.image]; }
      for (const img of oldImages) {
        const oldPath = path.join(__dirname, '../uploads', img);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    await Product.update(req.params.id, { category_id, title, description, price, size, stock, status, item_condition, image });

    const updated = await Product.getById(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// DELETE /api/products/:id
async function deleteProduct(req, res) {
  try {
    const product = await Product.getById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (product.image) {
      let oldImages = [];
      try { oldImages = JSON.parse(product.image); } catch(e) { oldImages = [product.image]; }
      for (const img of oldImages) {
        const oldPath = path.join(__dirname, '../uploads', img);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    await Product.delete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

const Jimp = require('jimp');
const jsQR = require('jsqr');
const Tesseract = require('tesseract.js');

function extractPromptPayAmount(payload) {
  let i = 0;
  while (i < payload.length) {
    const id = payload.substring(i, i + 2);
    const lengthStr = payload.substring(i + 2, i + 4);
    const length = parseInt(lengthStr, 10);
    if (isNaN(length)) break;
    const value = payload.substring(i + 4, i + 4 + length);
    if (id === '54') return parseFloat(value);
    i += 4 + length;
  }
  return null;
}


// POST /api/products/checkout
async function checkout(req, res) {
  try {
    let { items, shippingAddress } = req.body;
    
    // items will be a JSON string if sent via FormData
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch(e) {}
    }

    if (!items || !items.length) {
      return res.status(400).json({ message: 'Cart is empty' });
    }
    if (!shippingAddress) {
      return res.status(400).json({ message: 'Shipping address is required' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'กรุณาแนบสลิปการโอนเงิน' });
    }
    
    // Verify Slip (Fake slip detection)
    try {
      const imagePath = req.file.path;
      const image = await Jimp.read(imagePath);
      const { width, height, data } = image.bitmap;
      const qrCode = jsQR(new Uint8ClampedArray(data), width, height);

      if (!qrCode) {
        // No QR Code found, reject
        fs.unlinkSync(imagePath);
        return res.status(400).json({ message: 'ตรวจไม่พบ QR Code บนสลิป โปรดใช้สลิปธนาคารของจริง' });
      }
    } catch (qrErr) {
      console.error('QR Check Error:', qrErr);
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'รูปภาพสลิปอ่านไม่ได้หรือไม่รองรับ' });
    }

    const slipImage = req.file.filename;

    await Product.checkout(req.user.id, items, shippingAddress, slipImage);
    res.json({ message: 'Checkout successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Checkout failed. Stock might be insufficient.' });
  }
}

module.exports = {
  getProducts,
  getCategories,
  getProduct,
  getSellerProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  checkout,
};
