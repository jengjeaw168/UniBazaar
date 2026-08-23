const express        = require('express');
const router         = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');
const upload         = require('../middlewares/uploadMiddleware');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/me  (protected)
router.get('/me', authenticate, authController.me);

// PUT /api/auth/profile
router.put('/profile', authenticate, upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'promptpay_qr', maxCount: 1 }]), authController.updateProfile);

// PUT /api/auth/password
router.put('/password', authenticate, authController.changePassword);

// POST /api/auth/forgot-password
router.post('/forgot-password', authenticate, authController.forgotPassword);

module.exports = router;
