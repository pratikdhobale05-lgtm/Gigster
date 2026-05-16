const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Project = require('../models/Project');
const { protect } = require('../middleware/authMiddleware'); // Check your auth path

// @route   POST /api/reviews
// @desc    Leave a review for a completed project
router.post('/', protect, async (req, res) => {
    try {
        const { projectId, rating, comment } = req.body;

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Ensure the project is actually completed
        if (project.status !== 'completed') {
            return res.status(400).json({ message: 'You can only review completed projects.' });
        }

        // Ensure the person reviewing is the client who made the project
        if (project.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the project client can leave a review.' });
        }

        // Create the review
        const review = await Review.create({
            project: projectId,
            reviewer: req.user._id,
            freelancer: project.hiredFreelancer,
            rating,
            comment
        });

        res.status(201).json({ success: true, message: 'Review submitted successfully!', data: review });
    } catch (error) {
        // If the unique index fires, it means they already left a review
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already reviewed this project.' });
        }
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @route   GET /api/reviews/freelancer/:freelancerId
// @desc    Get all reviews for a specific freelancer
router.get('/freelancer/:freelancerId', async (req, res) => {
    try {
        const reviews = await Review.find({ freelancer: req.params.freelancerId })
            .populate('reviewer', 'name')
            .populate('project', 'title');

        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;