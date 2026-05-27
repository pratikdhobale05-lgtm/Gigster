const express = require('express');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

// Protected routes — must come BEFORE the /:id wildcard
router.use(auth.protect);

router.get('/me/profile', userController.getMe);
router.patch('/me/profile', userController.updateProfile);

// Public route — view any user's profile (must be AFTER /me/profile)
router.get('/:id', userController.getProfile);

module.exports = router;
