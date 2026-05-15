const express = require('express');
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth'); // Import our security guards

const router = express.Router();

// --- ALL routes below this line require the user to be logged in ---
router.use(auth.protect); 

// Browse all open projects (We will let both roles see this for now)
router.get('/', projectController.getAllProjects);

// --- CLIENT ONLY ROUTES ---
router.post(
  '/', 
  auth.restrictTo('client'), 
  projectController.createProject
);

router.patch(
  '/:id/accept-bid', 
  auth.restrictTo('client'), 
  projectController.acceptBid
);

// --- FREELANCER ONLY ROUTES ---
router.post(
  '/:id/bids', 
  auth.restrictTo('freelancer'), 
  projectController.submitBid
);

module.exports = router;