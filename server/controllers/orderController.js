const Order = require('../models/Order');

async function getBuyerOrders(req, res) {
  try {
    const orders = await Order.getByBuyerId(req.user.id);
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getSellerOrders(req, res) {
  try {
    const orders = await Order.getBySellerId(req.user.id);
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });
    const success = await Order.updateStatus(id, req.user.id, status);
    if (!success) return res.status(404).json({ message: 'Order not found or not authorized' });
    res.json({ message: 'Order updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function updateOrderAddress(req, res) {
  try {
    const { id } = req.params;
    const { address } = req.body;
    if (!address) return res.status(400).json({ message: 'Address is required' });
    const success = await Order.updateAddress(id, req.user.id, address);
    if (!success) return res.status(404).json({ message: 'Order not found, not authorized, or status is not paid' });
    res.json({ message: 'Address updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { getBuyerOrders, getSellerOrders, updateOrderStatus, updateOrderAddress };