const mongoose = require('mongoose');
const User = require('./User');

const reviewSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reviewee: {
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

// --- STATIC METHOD: Calculate and update average ratings on the reviewee ---
reviewSchema.statics.calcAverageRatings = async function (revieweeId) {
    const stats = await this.aggregate([
        { $match: { reviewee: revieweeId } },
        {
            $group: {
                _id: '$reviewee',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    if (stats.length > 0) {
        await User.findByIdAndUpdate(revieweeId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: Math.round(stats[0].avgRating * 10) / 10
        });
    } else {
        await User.findByIdAndUpdate(revieweeId, {
            ratingsQuantity: 0,
            ratingsAverage: 0
        });
    }
};

// Trigger rating recalculation after save
reviewSchema.post('save', function () {
    this.constructor.calcAverageRatings(this.reviewee);
});

module.exports = mongoose.model('Review', reviewSchema);