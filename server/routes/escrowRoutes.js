const express = require('express');
const escrowController = require('../controllers/escrowController');
const auth = require('../middleware/auth');

const router = express.Router();

// Public Webhook route for Razorpay payment notifications
router.post('/webhook', escrowController.handleWebhook);

// --- ALL routes below this line require the user to be logged in ---
router.use(auth.protect);

// 1. Client creates a Razorpay payment order for the milestone
router.post(
    '/milestones/:id/create-order',
    auth.restrictTo('client'),
    escrowController.createPaymentOrder
);

// 2. Client verifies payment and funds the milestone
router.post(
    '/milestones/:id/verify-payment',
    auth.restrictTo('client'),
    escrowController.verifyPaymentAndFund
);

// 3. Freelancer submits the completed work
router.patch(
    '/milestones/:id/submit',
    auth.restrictTo('freelancer'),
    escrowController.submitWork
);

// 4. Client approves the work (Releasing funds)
router.patch(
    '/milestones/:id/approve',
    auth.restrictTo('client'),
    escrowController.approveWork
);

// 5. Either party raises a dispute
router.post(
    '/milestones/:id/dispute',
    escrowController.raiseDispute
);

module.exports = router;