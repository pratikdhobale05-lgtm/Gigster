const Message = require('../models/Message');

// We export a function that takes the 'io' instance from our main index.js
module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 User connected to chat: ${socket.id}`);

    // --- 1. JOIN A PROJECT ROOM ---
    // When a user clicks on a project, the React frontend will tell the socket to join this room.
    socket.on('joinProjectRoom', (projectId) => {
      socket.join(projectId);
      console.log(`🚪 User ${socket.id} joined project room: ${projectId}`);
    });

    // --- 2. SEND & BROADCAST A MESSAGE ---
    socket.on('sendMessage', async (data) => {
      try {
        const { projectId, senderId, text, fileUrl, fileType } = data;

        // Step A: Save the message permanently to MongoDB
        const newMessage = await Message.create({
          projectId,
          senderId,
          text,
          fileUrl,
          fileType,
        });

        // Step B: Populate the sender's details so the frontend has the name and avatar immediately
        const populatedMessage = await newMessage.populate({
          path: 'senderId',
          select: 'name profile.avatarUrl',
        });

        // Step C: Broadcast the message ONLY to the people inside this specific project room
        io.to(projectId).emit('receiveMessage', populatedMessage);

      } catch (err) {
        console.error('❌ Error sending message:', err.message);
        // Optional: Send an error back to the sender
        socket.emit('messageError', { error: 'Failed to send message' });
      }
    });

    // --- 3. HANDLE DISCONNECT ---
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected from chat: ${socket.id}`);
    });
  });
};