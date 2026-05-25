const express = require('express');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

// Public route — view any user's profile
router.get('/:id', userController.getProfile);

// Protected routes
router.use(auth.protect);

router.get('/me/profile', userController.getMe);
router.patch('/me/profile', userController.updateProfile);

module.exports = router;
