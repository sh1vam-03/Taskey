const express = require('express');
const router = express.Router();
const { signup, login, getProfile } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protect, getProfile);

module.exports = router;
