const express = require('express');
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');
const { upload } = require('../utils/fileUpload');

const router = express.Router();

// All message routes require the user to be logged in
router.use(auth.protect);

// 1. Fetch chat history for a specific project
router.get('/project/:projectId', messageController.getProjectMessages);

// Custom wrapper for multer upload to handle busboy/upload errors cleanly without crashing
const handleUpload = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            console.error('File upload middleware error:', err.message);
            return res.status(400).json({ status: 'fail', message: err.message || 'File upload error' });
        }
        next();
    });
};

// 2. Upload a file to Cloudinary
router.post(
    '/upload',
    handleUpload,
    messageController.uploadChatFile
);

module.exports = router;