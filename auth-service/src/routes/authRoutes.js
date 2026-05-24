const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/health', authController.health);
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refresh);
router.post('/auth/logout', authenticate, authController.logout);
router.get('/auth/me', authenticate, authController.me);

router.post('/auth/admin/users', authenticate, requireRole('ADMIN'), authController.createAdminUser);
router.get('/auth/admin/users', authenticate, requireRole('ADMIN'), authController.listUsers);
router.patch('/auth/admin/users/:id/status', authenticate, requireRole('ADMIN'), authController.updateUserStatus);

module.exports = router;
