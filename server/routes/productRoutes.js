const express           = require('express');
const router            = express.Router();
const productController = require('../controllers/productController');
const { authenticate }  = require('../middlewares/authMiddleware');
const upload            = require('../middlewares/uploadMiddleware');

// Public routes
router.get('/',                         productController.getProducts);
router.get('/categories',               productController.getCategories);
router.get('/seller/:sellerId',         productController.getSellerProducts);
router.get('/:id',                      productController.getProduct);

// Protected routes
router.post('/checkout', authenticate, upload.single('slip_image'), productController.checkout);
router.post('/',   authenticate, upload.array('images', 5), productController.createProduct);
router.put('/:id', authenticate, upload.array('images', 5), productController.updateProduct);
router.delete('/:id', authenticate,                      productController.deleteProduct);

module.exports = router;
