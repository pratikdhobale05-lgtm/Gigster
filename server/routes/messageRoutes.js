const express = require('express');
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');
const { upload } = require('../utils/fileUpload');

const router = express.Router();

// All message routes require the user to be logged in
router.use(auth.protect);

// 1. Fetch chat history for a specific project
router.get('/project/:projectId', messageController.getProjectMessages);

// 2. Upload a file to Cloudinary
// 'upload.single("file")' tells multer to look for a single file attached to the field named "file"
router.post(
    '/upload',
    upload.single('file'),
    messageController.uploadChatFile
);

module.exports = router;