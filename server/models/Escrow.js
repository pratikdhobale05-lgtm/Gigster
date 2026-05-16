const mongoose = require('mongoose');

const escrowSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    freelancer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['funded', 'released', 'refunded'],
        default: 'funded'
    }
}, { timestamps: true });

module.exports = mongoose.model('Escrow', escrowSchema);