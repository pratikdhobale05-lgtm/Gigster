const express = require('express');
const router = express.Router();
const Proposal = require('../models/Proposal');
const Project = require('../models/Project');
const Milestone = require('../models/Milestone');
const auth = require('../middleware/auth');

// @route   POST /api/proposals
// @desc    Freelancer submits a proposal
router.post('/', auth.protect, auth.restrictTo('freelancer'), async (req, res) => {
    try {
        const { project, price, coverLetter } = req.body;

        // Check if freelancer already submitted a proposal for this project
        const existing = await Proposal.findOne({ project, freelancer: req.user._id });
        if (existing) {
            return res.status(400).json({ message: 'You have already submitted a proposal for this project.' });
        }

        const proposal = await Proposal.create({
            project,
            freelancer: req.user._id,
            price,
            coverLetter
        });

        res.status(201).json({ success: true, data: proposal });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @route   GET /api/proposals
// @desc    Get proposals for a specific project (Clients only)
router.get('/', auth.protect, async (req, res) => {
    try {
        const projectId = req.query.project;

        if (!projectId) {
            return res.status(400).json({ message: 'Project ID is required' });
        }

        // Verify that the person asking is the client who owns the project
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const clientId = project.clientId?._id?.toString() || project.clientId?.toString();
        if (clientId !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view these proposals' });
        }

        const proposals = await Proposal.find({ project: projectId })
            .populate('freelancer', 'name email profile ratingsAverage ratingsQuantity');

        res.status(200).json({ success: true, data: proposals });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @route   PUT /api/proposals/:id/accept
// @desc    Client accepts a freelancer's proposal
router.put('/:id/accept', auth.protect, auth.restrictTo('client'), async (req, res) => {
    try {
        const proposal = await Proposal.findById(req.params.id);
        if (!proposal) {
            return res.status(404).json({ message: 'Proposal not found' });
        }

        const project = await Project.findById(proposal.project);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Verify the user is the client who owns the project
        const clientId = project.clientId?._id?.toString() || project.clientId?.toString();
        if (clientId !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the project owner can accept proposals' });
        }

        // Update Proposal Status
        proposal.status = 'accepted';
        await proposal.save();

        // Reject all other proposals
        await Proposal.updateMany(
            { project: project._id, _id: { $ne: proposal._id } },
            { status: 'rejected' }
        );

        // Update Project Status & Assign Freelancer
        project.status = 'in_progress';
        project.freelancerId = proposal.freelancer;
        await project.save();

        // Create the first milestone for Escrow
        const milestone = await Milestone.create({
            projectId: project._id,
            title: 'Project Delivery',
            amount: proposal.price,
            status: 'pending'
        });

        res.status(200).json({
            success: true,
            message: 'Proposal accepted successfully!',
            data: { proposal, project, milestone }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;