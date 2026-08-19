const Project = require('../models/Project');
const Milestone = require('../models/Milestone');
const Escrow = require('../models/Escrow');
const { createOrder, verifyPaymentSignature, verifyWebhookSignature, isSimulated } = require('../services/razorpayService');

// ─────────────────────────────────────────────────────
// 1. Create a Razorpay payment order for the milestone
// ─────────────────────────────────────────────────────
exports.createPaymentOrder = async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await Project.findById(projectId);

        if (!project) return res.status(404).json({ message: 'Project not found' });
        const clientId = project.clientId?._id?.toString() || project.clientId?.toString();
        if (clientId !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the project owner can fund milestones' });
        }
        if (!project.freelancerId) return res.status(400).json({ message: 'Must hire a freelancer first' });

        // Find the pending milestone for this project
        const milestone = await Milestone.findOne({ projectId: project._id, status: 'pending' });
        if (!milestone) return res.status(404).json({ message: 'No pending milestone found' });

        // Create a Razorpay order
        const order = await createOrder(milestone.amount, `milestone_${milestone._id}`, {
            projectId: project._id.toString(),
            milestoneId: milestone._id.toString(),
            clientId: req.user._id.toString(),
        });

        // Store the Razorpay order ID on the milestone for later verification
        milestone.razorpayOrderId = order.id;
        await milestone.save();

        res.status(200).json({
            success: true,
            data: {
                orderId: order.id,
                amount: order.amount,       // in paise
                currency: order.currency,
                milestoneId: milestone._id,
                keyId: process.env.RAZORPAY_KEY_ID,  // Frontend needs this to open checkout
                simulated: isSimulated,      // Frontend skips Razorpay modal in simulated mode
            }
        });
    } catch (error) {
        console.error('Create payment order error:', error);
        res.status(500).json({ message: 'Server error creating payment order', error: error.message });
    }
};

// ─────────────────────────────────────────────────────
// 2. Verify Razorpay payment and fund the milestone
// ─────────────────────────────────────────────────────
exports.verifyPaymentAndFund = async (req, res) => {
    try {
        const projectId = req.params.id;
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: 'Missing payment verification details' });
        }

        // Verify the payment signature (HMAC check)
        const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
        if (!isValid) {
            return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
        }

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        const clientId = project.clientId?._id?.toString() || project.clientId?.toString();
        if (clientId !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the project owner can verify payments' });
        }

        // Find the milestone that matches this Razorpay order
        const milestone = await Milestone.findOne({
            projectId: project._id,
            razorpayOrderId: razorpay_order_id,
            status: 'pending'
        });
        if (!milestone) return res.status(404).json({ message: 'No matching pending milestone found for this payment' });

        // Update milestone status to funded
        milestone.status = 'funded';
        milestone.razorpayPaymentId = razorpay_payment_id;
        await milestone.save();

        // Create the Escrow record
        const escrow = await Escrow.create({
            project: project._id,
            milestoneId: milestone._id,
            client: req.user._id,
            freelancer: project.freelancerId._id || project.freelancerId,
            amount: milestone.amount,
            status: 'funded'
        });

        // Update the project status
        project.status = 'funded';
        await project.save();

        res.status(200).json({
            success: true,
            message: 'Payment verified! Milestone funded securely.',
            data: { escrow, milestone }
        });
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ message: 'Server error verifying payment', error: error.message });
    }
};

// ─────────────────────────────────────────────────────
// 2.5 Handle Razorpay Webhook Event (Asynchronous capture)
// ─────────────────────────────────────────────────────
exports.handleWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'] || req.headers['X-Razorpay-Signature'] || req.headers['x-razorpay-signature-sha256'];
        if (!signature) {
            return res.status(400).json({ message: 'Missing Webhook signature' });
        }

        // Verify webhook signature
        const rawBody = JSON.stringify(req.body);
        const isValid = verifyWebhookSignature(rawBody, signature);
        if (!isValid) {
            return res.status(400).json({ message: 'Invalid Webhook signature' });
        }

        const event = req.body.event;
        
        // Handle only order.paid or payment.captured
        if (event === 'order.paid' || event === 'payment.captured') {
            const orderId = req.body.payload?.payment?.entity?.order_id || req.body.payload?.order?.entity?.id;
            const paymentId = req.body.payload?.payment?.entity?.id;

            if (!orderId) {
                return res.status(200).json({ success: true, message: 'No order ID in payload' });
            }

            // Find the milestone matching this Razorpay order
            const milestone = await Milestone.findOne({
                razorpayOrderId: orderId,
                status: 'pending'
            });

            if (!milestone) {
                return res.status(200).json({ success: true, message: 'No matching pending milestone' });
            }

            const project = await Project.findById(milestone.projectId);
            if (!project) {
                return res.status(200).json({ success: true, message: 'Project not found' });
            }

            // Update milestone
            milestone.status = 'funded';
            milestone.razorpayPaymentId = paymentId || milestone.razorpayPaymentId || 'pay_web_' + orderId.substring(10);
            await milestone.save();

            // Check if Escrow already exists
            const existingEscrow = await Escrow.findOne({ milestoneId: milestone._id });
            if (!existingEscrow) {
                await Escrow.create({
                    project: project._id,
                    milestoneId: milestone._id,
                    client: project.clientId?._id || project.clientId,
                    freelancer: project.freelancerId?._id || project.freelancerId,
                    amount: milestone.amount,
                    status: 'funded'
                });
            }

            // Update project status
            project.status = 'funded';
            await project.save();

            return res.status(200).json({ success: true, message: 'Payment successfully processed via Webhook' });
        }

        res.status(200).json({ success: true, message: 'Event ignored' });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ message: 'Server error processing webhook', error: error.message });
    }
};

// ─────────────────────────────────────────────────────
// 3. Freelancer submits the completed work
// ─────────────────────────────────────────────────────
exports.submitWork = async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await Project.findById(projectId);

        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Security check: Only the hired freelancer can submit work
        const freelancerId = project.freelancerId?._id?.toString() || project.freelancerId?.toString();
        if (freelancerId !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the hired freelancer can submit work' });
        }

        // Update milestone — set submittedAt and auto-approval deadline (14 days)
        const milestone = await Milestone.findOne({ projectId: project._id, status: 'funded' });
        if (milestone) {
            milestone.status = 'submitted';
            milestone.submittedAt = new Date();
            milestone.autoApprovalDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
            await milestone.save();
        }

        // Update project status
        project.status = 'under_review';
        await project.save();

        res.status(200).json({ success: true, message: 'Work submitted for review! Client has 14 days to respond.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error submitting work', error: error.message });
    }
};

// ─────────────────────────────────────────────────────
// 4. Client approves the work (Releasing funds)
// ─────────────────────────────────────────────────────
exports.approveWork = async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const clientId = project.clientId?._id?.toString() || project.clientId?.toString();
        if (clientId !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the project owner can approve work' });
        }

        // Update milestone status
        const milestone = await Milestone.findOne({ projectId: projectId, status: 'submitted' });
        if (!milestone) return res.status(404).json({ message: 'No submitted milestone found for this project' });

        milestone.status = 'approved';
        await milestone.save();

        // Find and release the escrow record tied to this specific milestone
        const escrow = await Escrow.findOne({ milestoneId: milestone._id, status: 'funded' });
        if (escrow) {
            escrow.status = 'released';
            await escrow.save();
        }

        // Update the project to completed
        project.status = 'completed';
        await project.save();

        res.status(200).json({ success: true, message: 'Work approved and funds released!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error approving work', error: error.message });
    }
};

// ─────────────────────────────────────────────────────
// 5. Either party raises a dispute
// ─────────────────────────────────────────────────────
exports.raiseDispute = async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await Project.findById(projectId);

        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Only client or hired freelancer can raise a dispute
        const isClient = project.clientId._id.toString() === req.user._id.toString();
        const isFreelancer = (project.freelancerId?._id?.toString() || project.freelancerId?.toString()) === req.user._id.toString();

        if (!isClient && !isFreelancer) {
            return res.status(403).json({ message: 'Only project participants can raise a dispute' });
        }

        // Pause auto-approval on milestone
        const milestone = await Milestone.findOne({ projectId: projectId, status: { $in: ['submitted', 'funded'] } });
        if (milestone) {
            milestone.status = 'disputed';
            milestone.autoApprovalDeadline = null; // Pause the timer
            await milestone.save();
        }

        // Lock the escrow tied to this specific milestone
        const escrow = await Escrow.findOne({
            milestoneId: milestone ? milestone._id : undefined,
            status: 'funded'
        });
        if (escrow) {
            escrow.status = 'disputed';
            await escrow.save();
        }

        // Update project status
        project.status = 'disputed';
        await project.save();

        res.status(200).json({
            success: true,
            message: 'Dispute raised. Funds are locked and a platform admin will review the case.'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error raising dispute', error: error.message });
    }
};