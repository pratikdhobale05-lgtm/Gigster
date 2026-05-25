const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

// @route   POST /api/reviews
// @desc    Leave a review for a completed project (both parties can review)
router.post('/', auth.protect, async (req, res) => {
    try {
        const { projectId, rating, comment } = req.body;

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Ensure the project is actually completed
        if (project.status !== 'completed') {
            return res.status(400).json({ message: 'You can only review completed projects.' });
        }

        const isClient = (project.clientId?._id?.toString() || project.clientId?.toString()) === req.user._id.toString();
        const isFreelancer = (project.freelancerId?._id?.toString() || project.freelancerId?.toString()) === req.user._id.toString();

        if (!isClient && !isFreelancer) {
            return res.status(403).json({ message: 'Only project participants can leave a review.' });
        }

        // Determine who is being reviewed
        let reviewee;
        if (isClient) {
            reviewee = project.freelancerId?._id || project.freelancerId;
        } else {
            reviewee = project.clientId?._id || project.clientId;
        }

        // Create the review
        const review = await Review.create({
            project: projectId,
            reviewer: req.user._id,
            reviewee,
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

// @route   GET /api/reviews/user/:userId
// @desc    Get all reviews for a specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const reviews = await Review.find({ reviewee: req.params.userId })
            .populate('reviewer', 'name profile.avatarUrl')
            .populate('project', 'title');

        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// Keep backward compatibility
router.get('/freelancer/:freelancerId', async (req, res) => {
    try {
        const reviews = await Review.find({ reviewee: req.params.freelancerId })
            .populate('reviewer', 'name profile.avatarUrl')
            .populate('project', 'title');

        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;