const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middlewares/authMiddleware');

router.get('/buyer', authenticate, orderController.getBuyerOrders);
router.get('/seller', authenticate, orderController.getSellerOrders);
router.patch('/:id/status', authenticate, orderController.updateOrderStatus);
router.patch('/:id/address', authenticate, orderController.updateOrderAddress);

module.exports = router;
