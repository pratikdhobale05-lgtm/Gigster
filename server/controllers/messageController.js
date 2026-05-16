const Message = require('../models/Message');
const { uploadToCloudinary } = require('../utils/fileUpload');

// --- 1. FETCH CHAT HISTORY ---
exports.getProjectMessages = async (req, res) => {
  try {
    // Find all messages for this specific project and sort by oldest first
    const messages = await Message.find({ projectId: req.params.projectId })
      .sort({ createdAt: 1 });

    res.status(200).json({
      status: 'success',
      data: { messages }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// --- 2. UPLOAD A FILE ---
exports.uploadChatFile = async (req, res) => {
  try {
    // Check if a file was actually attached
    if (!req.file) {
      return res.status(400).json({ status: 'fail', message: 'Please upload a file' });
    }

    // Upload the file buffer to a Cloudinary folder named 'gigster_chats'
    const result = await uploadToCloudinary(req.file.buffer, 'gigster_chats');

    // Return the secure URL to the frontend
    res.status(200).json({
      status: 'success',
      data: {
        fileUrl: result.secure_url,
        fileType: result.resource_type // e.g., 'image' or 'raw' (for pdfs/zips)
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: 'File upload failed' });
  }
};