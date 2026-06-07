const express = require('express');
const env = require('../config/env');
const meController = require('../controllers/meController');

const router = express.Router();

router.get('/api/v1/me', meController.getMe);
router.get('/api/v1/me/profile', meController.getProfile);
router.patch('/api/v1/me/profile', express.json({ limit: env.jsonBodyLimit }), meController.updateProfile);
router.get('/api/v1/me/topics', meController.getTopics);
router.get('/api/v1/me/reports', meController.getReports);
router.get('/api/v1/me/history', meController.listHistory);

module.exports = router;
