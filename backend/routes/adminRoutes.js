const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyAccessToken, requireRole } = require('../middlewares/authMiddleware');

router.post('/create-user', verifyAccessToken, requireRole('super-admin'), adminController.createUser);

module.exports = router;
