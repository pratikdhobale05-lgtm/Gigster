const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: [true, 'A milestone must belong to a project'],
        },
        title: {
            type: String,
            required: [true, 'A milestone must have a title or description'],
            trim: true,
            maxlength: 150,
        },
        amount: {
            type: Number,
            required: [true, 'A milestone must have a monetary amount'],
            min: [1, 'Amount must be at least 1'],
        },
        status: {
            type: String,
            enum: [
                'pending',   // Created, but not yet paid by client
                'funded',    // Client paid, funds in escrow
                'submitted', // Freelancer submitted work for review
                'approved',  // Client approved work (triggers payout)
                'paid',      // Money successfully routed to freelancer's bank account
                'disputed'   // Issue raised, funds locked for admin review
            ],
            default: 'pending',
        },
        // Store the Stripe Payment Intent ID or Razorpay Order ID for verification
        paymentIntentId: {
            type: String,
            select: false, // Keep it private so it doesn't leak to the frontend unnecessarily
        },
        // Timestamp for when the freelancer hits "Submit Work"
        // We need this to calculate the 14-day Auto-Approval cron job
        submittedAt: {
            type: Date,
        }
    },
    { timestamps: true }
);

// --- MIDDLEWARE: Prevent modification of paid milestones ---
// This is a safety net. Once a milestone is paid, no one should be able to alter its amount or status.
milestoneSchema.pre('save', function () {
    // Prevent edits to paid milestones
    if (this.isModified() && this.status === 'paid' && !this.isNew) {
        throw new Error('Cannot modify a milestone that has already been paid out.');
    }
});

const Milestone = mongoose.model('Milestone', milestoneSchema);
module.exports = Milestone;