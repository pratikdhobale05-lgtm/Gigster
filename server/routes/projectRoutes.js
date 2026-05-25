const express = require('express');
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth');

const router = express.Router();

// --- ALL routes below this line require the user to be logged in ---
router.use(auth.protect);

// Browse all open projects (both roles can see)
router.get('/', projectController.getAllProjects);

// Get my projects (for dashboard — role-aware)
router.get('/my', projectController.getMyProjects);

// Get a specific project
router.get('/:id', projectController.getProject);

// --- CLIENT ONLY ROUTES ---
router.post(
    '/',
    auth.restrictTo('client'),
    projectController.createProject
);

module.exports = router;