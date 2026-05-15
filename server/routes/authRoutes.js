const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// These routes do NOT need the `protect` middleware because 
// the user doesn't have a token yet!
router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;