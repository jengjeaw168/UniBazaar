const bcrypt           = require('bcryptjs');
const User             = require('../models/User');
const { generateToken } = require('../config/jwt');

// POST /api/auth/register
async function register(req, res) {
  try {
    const { username, email, password, full_name, phone } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const emailExists    = await User.findByEmail(email);
    if (emailExists) return res.status(409).json({ message: 'Email already registered' });

    const usernameExists = await User.findByUsername(username);
    if (usernameExists) return res.status(409).json({ message: 'Username already taken' });

    const hashed = await bcrypt.hash(password, 12);
    const id     = await User.create({ username, email, password: hashed, full_name, phone });

    const token = generateToken({ id, role: 'user' });
    res.status(201).json({ token, user: { id, username, email, role: 'user', full_name, phone } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findByUsername(username);
    if (!user) return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

    if (user.is_banned) {
      return res.status(403).json({ message: 'Your account has been banned' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

    const token = generateToken({ id: user.id, role: user.role });
    const userResponse = { ...user };
    delete userResponse.password;
    delete userResponse.reset_otp;
    res.json({ token, user: userResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// GET /api/auth/me
async function me(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// PUT /api/auth/profile
async function updateProfile(req, res) {
  try {
    const { address, full_name, phone } = req.body;
    console.log("UPDATE PROFILE REQUEST BODY:", req.body);
    console.log("UPDATE PROFILE REQUEST FILES:", req.files);
    let avatar, promptpay_qr;
    if (req.files) {
      if (req.files['avatar']) avatar = req.files['avatar'][0].filename;
      if (req.files['promptpay_qr']) promptpay_qr = req.files['promptpay_qr'][0].filename;
    } else if (req.file) {
      avatar = req.file.filename;
    }
    await User.updateProfile(req.user.id, { address, full_name, phone, avatar, promptpay_qr });
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// PUT /api/auth/password
async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword, otp } = req.body;
    if (!newPassword) return res.status(400).json({ message: 'New password is required' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });

    if (otp) {
      const isValid = await User.verifyOtp(req.user.id, otp);
      if (!isValid) return res.status(401).json({ message: 'รหัส OTP ไม่ถูกต้อง' });
    } else if (oldPassword) {
      const [[fullUser]] = await require('../config/db').pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
      if (!fullUser) return res.status(404).json({ message: 'User not found' });
      const match = await bcrypt.compare(oldPassword, fullUser.password);
      if (!match) return res.status(401).json({ message: 'รหัสผ่านเดิมไม่ถูกต้อง' });
    } else {
      return res.status(400).json({ message: 'ต้องระบุรหัสผ่านเดิม หรือ OTP อย่างใดอย่างหนึ่ง' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await User.updatePassword(req.user.id, hashed);
    res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/auth/forgot-password
async function forgotPassword(req, res) {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await User.setOtp(req.user.id, otp);
    res.json({ message: `จำลองการส่งอีเมล: รหัส OTP ของคุณคือ ${otp}`, otp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { register, login, me, updateProfile, changePassword, forgotPassword };
