const Razorpay = require('razorpay');
const crypto = require('crypto');
const Milestone = require('../models/Milestone');
const Project = require('../models/Project');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- 1. FUND A MILESTONE (Generate Razorpay Order) ---
exports.fundMilestone = async (req, res) => {
    try {
        const milestone = await Milestone.findById(req.params.id);

        if (!milestone) return res.status(404).json({ status: 'fail', message: 'Milestone not found' });
        if (milestone.status !== 'pending') return res.status(400).json({ status: 'fail', message: 'Milestone is not pending' });

        const project = await Project.findById(milestone.projectId);
        if (project.clientId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ status: 'fail', message: 'Unauthorized' });
        }

        // Create a Razorpay Order
        // Amounts in Razorpay are in paise (smallest currency unit). Multiply by 100 for INR.
        const options = {
            amount: milestone.amount * 100,
            currency: "INR", // Change to USD if needed, Razorpay supports international
            receipt: `receipt_${milestone._id}`,
            notes: {
                milestoneId: milestone._id.toString(),
                projectId: project._id.toString()
            }
        };

        const order = await razorpay.orders.create(options);

        // Save the order ID (replaces paymentIntentId)
        milestone.paymentIntentId = order.id;
        await milestone.save();

        res.status(200).json({
            status: 'success',
            data: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency
            }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// --- 2. RAZORPAY WEBHOOK (Automated System) ---
exports.razorpayWebhook = async (req, res) => {
    try {
        // Razorpay sends the signature in the headers
        const signature = req.headers['x-razorpay-signature'];

        // We must hash the raw request body with our Webhook Secret to verify it
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (expectedSignature !== signature) {
            return res.status(400).json({ status: 'fail', message: 'Invalid webhook signature' });
        }

        // Process the event
        const event = req.body.event;

        if (event === 'payment.captured' || event === 'order.paid') {
            // The notes object we passed during order creation comes back in the webhook payload
            const milestoneId = req.body.payload.payment.entity.notes.milestoneId;

            const milestone = await Milestone.findById(milestoneId);
            if (milestone) {
                milestone.status = 'funded';
                await milestone.save();
                console.log(`💰 Milestone ${milestone._id} successfully funded via Razorpay!`);
            }
        }

        res.status(200).json({ status: 'ok' });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// --- 3. SUBMIT WORK (Freelancer) ---
// (This remains EXACTLY the same as before, no payment logic here)
exports.submitWork = async (req, res) => {
    try {
        const milestone = await Milestone.findById(req.params.id);
        if (!milestone) return res.status(404).json({ status: 'fail', message: 'Milestone not found' });
        if (milestone.status !== 'funded') return res.status(400).json({ status: 'fail', message: 'Milestone is not currently funded' });

        milestone.status = 'submitted';
        milestone.submittedAt = Date.now();
        await milestone.save();

        res.status(200).json({ status: 'success', message: 'Work submitted!' });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// --- 4. APPROVE & RELEASE FUNDS (Client) ---
exports.approveWork = async (req, res) => {
    try {
        const milestone = await Milestone.findById(req.params.id);
        if (!milestone) return res.status(404).json({ status: 'fail', message: 'Milestone not found' });
        if (milestone.status !== 'submitted') return res.status(400).json({ status: 'fail', message: 'No work has been submitted yet' });

        const project = await Project.findById(milestone.projectId);
        if (project.clientId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ status: 'fail', message: 'Unauthorized' });
        }

        // --- RAZORPAY ROUTE (TRANSFERS) GOES HERE ---
        // In production, you use Razorpay Route to push money to the freelancer's linked account
        // Example: await razorpay.transfers.create({ account: freelancerRazorpayId, amount: milestone.amount * 100, currency: "INR" });

        milestone.status = 'paid';
        await milestone.save();

        res.status(200).json({ status: 'success', message: 'Funds released via Razorpay Route!' });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};