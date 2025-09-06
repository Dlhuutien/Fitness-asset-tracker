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

module.exports = router;
