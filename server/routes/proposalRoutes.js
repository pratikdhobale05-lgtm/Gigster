const express = require('express');
const router = express.Router();
const Proposal = require('../models/Proposal');
const Project = require('../models/Project');
const { protect } = require('../middleware/authMiddleware'); // Check this path!

// @route   POST /api/proposals
// @desc    Freelancer submits a proposal
router.post('/', protect, async (req, res) => {
    try {
        const { project, price, coverLetter } = req.body;

        // Optional: Check if user is actually a freelancer
        if (req.user.role !== 'freelancer') {
            return res.status(403).json({ message: 'Only freelancers can bid.' });
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
router.get('/', protect, async (req, res) => {
    try {
        const projectId = req.query.project;

        if (!projectId) {
            return res.status(400).json({ message: 'Project ID is required' });
        }

        // Optional: Verify that the person asking is the client who owns the project
        const project = await Project.findById(projectId);
        if (project.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view these proposals' });
        }

        const proposals = await Proposal.find({ project: projectId }).populate('freelancer', 'name email');

        res.status(200).json({ success: true, data: proposals });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;