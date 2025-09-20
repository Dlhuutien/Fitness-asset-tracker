const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyAccessToken, requireRole } = require('../middlewares/authMiddleware');

// Protected routes
router.get('/me', verifyAccessToken, userController.getMe);

router.get('/admin-only',
  verifyAccessToken,
  requireRole('admin', 'super-admin'),
  userController.adminOnly
);

router.get('/super-admin-only',
  verifyAccessToken,
  requireRole('super-admin'),
  userController.superAdminOnly
);

router.get('/tech-or-operator',
  verifyAccessToken,
  requireRole('technician', 'operator', 'admin', 'super-admin'),
  userController.techOrOperator
);

// Admin tạo user
router.post("/create", verifyAccessToken, userController.createUser);

// Đổi password
router.post('/change-password', verifyAccessToken, userController.changePassword);

// Cập nhật thông tin
router.put('/update-info', verifyAccessToken, userController.updateInfo);

// Admin/super-admin cập nhật user status
router.put('/change-status',
  verifyAccessToken,
  requireRole('admin', 'super-admin'),
  userController.updateStatus
);

// Admin/super-admin cập nhật thông tin user
router.put(
  '/admin-update-user',
  verifyAccessToken,
  requireRole('admin', 'super-admin'),
  userController.adminUpdateUserAttributes
);

// Admin/super-admin lấy danh sách users
router.get('/list-user',
  verifyAccessToken,
  requireRole('admin', 'super-admin'),
  userController.listUsers
);

module.exports = router;
