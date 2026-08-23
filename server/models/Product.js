const { pool } = require('../config/db');

const Product = {
  async getAll({ search = '', category = '', page = 1, limit = 12 } = {}) {
    const offset = (page - 1) * limit;
    const params = [];
    let where    = 'WHERE 1=1';

    if (search) {
      where  += ' AND MATCH(p.title, p.description) AGAINST(? IN BOOLEAN MODE)';
      params.push(`${search}*`);
    }

    if (category) {
      where  += ' AND c.name = ?';
      params.push(category);
    }

    const baseQuery = `
      FROM products p
      JOIN users      u ON p.seller_id   = u.id
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN seller_ratings sr ON sr.seller_id = p.seller_id
      ${where}
    `;

    const [rows] = await pool.query(
      `SELECT p.*, u.username AS seller_name, c.name AS category_name,
              sr.avg_rating, sr.review_count
       ${baseQuery}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${baseQuery}`, params);

    return { rows, total, page, limit };
  },

  async getById(id) {
    const [rows] = await pool.query(
      `SELECT p.*, u.username AS seller_name, u.email AS seller_email, u.avatar AS seller_avatar, u.promptpay_qr AS seller_qr,
              c.name AS category_name, sr.avg_rating, sr.review_count
       FROM products p
       JOIN users      u ON p.seller_id   = u.id
       JOIN categories c ON p.category_id = c.id
       LEFT JOIN seller_ratings sr ON sr.seller_id = p.seller_id
       WHERE p.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async create({ seller_id, category_id, title, description, price, size, stock, item_condition, image }) {
    const [result] = await pool.query(
      'INSERT INTO products (seller_id, category_id, title, description, price, size, stock, item_condition, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [seller_id, category_id, title, description, price, size || null, stock || 1, item_condition || 'มือ 2', image || null]
    );
    return result.insertId;
  },

  async update(id, { category_id, title, description, price, size, stock, status, item_condition, image }) {
    const fields = [];
    const values = [];

    if (category_id !== undefined) { fields.push('category_id = ?'); values.push(category_id); }
    if (title       !== undefined) { fields.push('title = ?');       values.push(title);       }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (price       !== undefined) { fields.push('price = ?');       values.push(price);       }
    if (size        !== undefined) { fields.push('size = ?');        values.push(size);        }
    if (stock       !== undefined) { fields.push('stock = ?');       values.push(stock);       }
    if (status      !== undefined) { fields.push('status = ?');      values.push(status);      }
    if (item_condition !== undefined) { fields.push('item_condition = ?'); values.push(item_condition); }
    if (image       !== undefined) { fields.push('image = ?');       values.push(image);       }

    if (!fields.length) return false;
    values.push(id);

    await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
  },

  async getBySellerId(sellerId) {
    const [rows] = await pool.query(
      `SELECT p.*, u.username AS seller_name, u.avatar AS seller_avatar, u.phone AS seller_phone, u.email AS seller_email, c.name AS category_name, sr.avg_rating, sr.review_count
       FROM products p
       JOIN users u ON p.seller_id = u.id
       JOIN categories c ON p.category_id = c.id
       LEFT JOIN seller_ratings sr ON sr.seller_id = p.seller_id
       WHERE p.seller_id = ?
       ORDER BY p.created_at DESC`,
      [sellerId]
    );
    return rows;
  },

  async getCategories() {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY name');
    return rows;
  },

  async checkout(buyerId, items, shippingAddress, slipImage) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const item of items) {
        // Decrease stock
        const [updateResult] = await connection.query(
          'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
          [item.quantity, item.id, item.quantity]
        );
        if (updateResult.affectedRows === 0) {
          throw new Error(`Insufficient stock for product ${item.id}`);
        }
        
        // Mark as sold if stock is 0
        await connection.query(
          'UPDATE products SET status = "sold" WHERE id = ? AND stock <= 0',
          [item.id]
        );

        // Create order record
        await connection.query(
          `INSERT INTO orders (buyer_id, seller_id, product_id, quantity, total_price, shipping_address, slip_image)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [buyerId, item.seller_id, item.id, item.quantity, item.price * item.quantity, shippingAddress, slipImage]
        );
      }
      await connection.commit();
      return true;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },
};

module.exports = Product;
