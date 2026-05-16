const mongoose = require('mongoose');

// Sub-schema for bids so we can embed them directly inside the Project document.
// This is faster than creating a separate collection for Bids since they are strictly tied to a project.
const bidSchema = new mongoose.Schema(
    {
        freelancerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        amount: {
            type: Number,
            required: [true, 'A bid must have an amount'],
            min: [1, 'Bid amount must be at least 1'],
        },
        proposal: {
            type: String,
            required: [true, 'Please provide a proposal or cover letter'],
            maxlength: 1000,
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

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
            // You can limit this to your specific niche later, e.g., enum: ['AI', 'Web3', '3D Rigging']
        },
        budget: {
            type: Number,
            required: [true, 'A project must have an estimated budget'],
        },
        status: {
            type: String,
            enum: ['open', 'in-progress', 'completed', 'cancelled'],
            default: 'open',
        },
        // The client who created the gig
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        // The freelancer who gets hired (null until a bid is accepted)
        freelancerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        // Array of embedded bids
        bids: [bidSchema],
    },
    { timestamps: true }
);

// --- MIDDLEWARE: Populate user data on query ---
// Whenever we query a project, automatically fetch the client's name and the hired freelancer's name
projectSchema.pre(/^find/, function () {
    this.populate({
        path: 'clientId',
        select: 'name email profile.avatarUrl',
    }).populate({
        path: 'freelancerId',
        select: 'name email profile.avatarUrl',
    });
});

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;