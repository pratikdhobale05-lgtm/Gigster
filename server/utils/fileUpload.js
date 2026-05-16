const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// 1. Configure Cloudinary with your .env keys
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Configure Multer to hold the file in memory temporarily
// We do not want to save files to our local server's hard drive!
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 3. Helper function to stream the file from memory directly to Cloudinary
const uploadToCloudinary = (fileBuffer, folderName) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { 
        folder: folderName, 
        resource_type: 'auto' // 'auto' allows images, PDFs, ZIPs, etc.
      }, 
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

module.exports = { upload, uploadToCloudinary };