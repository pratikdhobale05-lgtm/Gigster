const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    reviewer: { // The person leaving the review (Usually the Client)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    freelancer: { // The person getting reviewed
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true
    }
}, { timestamps: true });

// Prevent a user from leaving more than one review per project
reviewSchema.index({ project: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);