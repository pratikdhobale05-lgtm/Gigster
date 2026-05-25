const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'A project must have a title'],
            trim: true,
            maxlength: 100,
        },
        description: {
            type: String,
            required: [true, 'A project must have a description'],
        },
        category: {
            type: String,
            required: [true, 'Please specify the niche/category for this project'],
        },
        budget: {
            type: Number,
            required: [true, 'A project must have an estimated budget'],
        },
        deadline: {
            type: Date,
        },
        status: {
            type: String,
            enum: ['open', 'in_progress', 'funded', 'under_review', 'completed', 'cancelled', 'disputed'],
            default: 'open',
        },
        // The client who created the gig
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        // The freelancer who gets hired (null until a proposal is accepted)
        freelancerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    { timestamps: true }
);

// --- MIDDLEWARE: Populate user data on query ---
projectSchema.pre(/^find/, function () {
    this.populate({
        path: 'clientId',
        select: 'name email profile.avatarUrl ratingsAverage',
    }).populate({
        path: 'freelancerId',
        select: 'name email profile.avatarUrl ratingsAverage',
    });
});

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;