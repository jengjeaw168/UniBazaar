const { pool } = require('../config/db');

const Order = {
  async getByBuyerId(buyerId) {
    const [rows] = await pool.query(
      "SELECT o.*, p.title AS product_title, p.image AS product_image, p.price AS product_price, u.username AS seller_name FROM orders o JOIN products p ON o.product_id = p.id JOIN users u ON o.seller_id = u.id WHERE o.buyer_id = ? ORDER BY o.created_at DESC",
      [buyerId]
    );
    return rows;
  },

  async getBySellerId(sellerId) {
    const [rows] = await pool.query(
      "SELECT o.*, p.title AS product_title, p.image AS product_image, p.price AS product_price, u.username AS buyer_name, u.full_name AS buyer_full_name, u.phone AS buyer_phone FROM orders o JOIN products p ON o.product_id = p.id JOIN users u ON o.buyer_id = u.id WHERE o.seller_id = ? ORDER BY o.created_at DESC",
      [sellerId]
    );
    return rows;
  },

  async updateStatus(orderId, sellerId, status) {
    const [result] = await pool.query(
      'UPDATE orders SET status = ? WHERE id = ? AND seller_id = ?',
      [status, orderId, sellerId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = Order;
