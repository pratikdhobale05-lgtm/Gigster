const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        // The chat room this message belongs to (tied strictly to a Project)
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: [true, 'A message must belong to a project'],
        },
        // The person who sent it
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'A message must have a sender'],
        },
        // The actual chat text
        text: {
            type: String,
            // Make text required ONLY if there is no file attached
            required: function () {
                return !this.fileUrl;
            },
        },
        // --- Setup for the File Uploads we will do next ---
        fileUrl: {
            type: String,
        },
        fileType: {
            type: String, // e.g., 'image', 'pdf', 'zip'
        }
    },
    { timestamps: true } // Automatically handles createdAt so we can sort by time!
);

// --- MIDDLEWARE: Always fetch the sender's name and avatar ---
// When we load chat history, we want to show who said what without doing extra database queries.
messageSchema.pre(/^find/, function () {
    this.populate({
        path: 'senderId',
        select: 'name profile.avatarUrl', // Only grab what we need for the UI
    });
});

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;