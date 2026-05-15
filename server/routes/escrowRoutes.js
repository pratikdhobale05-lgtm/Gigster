const express = require('express');
const escrowController = require('../controllers/escrowController');
const auth = require('../middleware/auth');

const router = express.Router();

// --- ALL routes below this line require the user to be logged in ---
router.use(auth.protect);

// 1. Client funds the milestone
router.post(
    '/milestones/:id/fund',
    auth.restrictTo('client'),
    escrowController.fundMilestone
);

// 2. Freelancer submits the completed work
router.patch(
    '/milestones/:id/submit',
    auth.restrictTo('freelancer'),
    escrowController.submitWork
);

// 3. Client approves the work (Releasing funds)
router.patch(
    '/milestones/:id/approve',
    auth.restrictTo('client'),
    escrowController.approveWork
);

module.exports = router;