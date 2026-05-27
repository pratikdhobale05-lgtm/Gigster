const Project = require('../models/Project');
const Milestone = require('../models/Milestone');
const Escrow = require('../models/Escrow');

// 1. Client funds the milestone
exports.fundMilestone = async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await Project.findById(projectId);

        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (project.clientId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the project owner can fund milestones' });
        }
        if (!project.freelancerId) return res.status(400).json({ message: 'Must hire a freelancer first' });

        // Find the pending milestone for this project
        const milestone = await Milestone.findOne({ projectId: project._id, status: 'pending' });
        if (!milestone) return res.status(404).json({ message: 'No pending milestone found' });

        // Update milestone status
        milestone.status = 'funded';
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

        res.status(200).json({ success: true, message: 'Milestone funded securely!', data: { escrow, milestone } });
    } catch (error) {
        res.status(500).json({ message: 'Server error funding milestone', error: error.message });
    }
};

// 2. Freelancer submits the completed work
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

// 3. Client approves the work (Releasing funds)
exports.approveWork = async (req, res) => {
    try {
        const projectId = req.params.id;

        // Update milestone status first
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
        const project = await Project.findById(projectId);
        if (project) {
            project.status = 'completed';
            await project.save();
        }

        res.status(200).json({ success: true, message: 'Work approved and funds released!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error approving work', error: error.message });
    }
};

// 4. Either party raises a dispute
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