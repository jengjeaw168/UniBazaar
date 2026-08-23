const { pool } = require('../config/db');

const User = {
  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  async findByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, username, email, role, is_banned, avatar, address, full_name, phone, promptpay_qr, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async updateProfile(id, { address, full_name, phone, avatar, promptpay_qr }) {
    const updates = [];
    const values = [];
    if (address !== undefined) {
      updates.push('address = ?');
      values.push(address);
    }
    if (full_name !== undefined) {
      updates.push('full_name = ?');
      values.push(full_name);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (avatar !== undefined) {
      updates.push('avatar = ?');
      values.push(avatar);
    }
    if (promptpay_qr !== undefined) {
      updates.push('promptpay_qr = ?');
      values.push(promptpay_qr);
    }
    if (updates.length > 0) {
      values.push(id);
      await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    }
  },

  async create({ username, email, password, role = 'user', full_name, phone }) {
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, role, full_name, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, password, role, full_name || null, phone || null]
    );
    return result.insertId;
  },

  async delete(id) { await pool.query('DELETE FROM users WHERE id = ?', [id]); },

  async ban(id) {
    await pool.query('UPDATE users SET is_banned = 1 WHERE id = ?', [id]);
  },

  async unban(id) {
    await pool.query('UPDATE users SET is_banned = 0 WHERE id = ?', [id]);
  },

  async updatePassword(id, hashedPassword) {
    await pool.query('UPDATE users SET password = ?, reset_otp = NULL WHERE id = ?', [hashedPassword, id]);
  },

  async setOtp(id, otp) {
    await pool.query('UPDATE users SET reset_otp = ? WHERE id = ?', [otp, id]);
  },

  async verifyOtp(id, otp) {
    const [rows] = await pool.query('SELECT reset_otp FROM users WHERE id = ? AND reset_otp = ?', [id, otp]);
    return rows.length > 0;
  },

  async getAll({ page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      'SELECT id, username, email, role, is_banned, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM users');
    return { rows, total };
  },
};

module.exports = User;
