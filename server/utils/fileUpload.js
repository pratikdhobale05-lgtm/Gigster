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
// In dev/test mode when Cloudinary keys are missing or invalid, falls back gracefully to a data URL
const uploadToCloudinary = (fileBuffer, folderName, originalName = 'file') => {
  return new Promise((resolve, reject) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const isCloudinaryConfigured = cloudName && cloudName !== 'your_cloud_name' && process.env.CLOUDINARY_API_KEY !== 'your_api_key';

    if (!isCloudinaryConfigured) {
      // Dev/Fallback mode: Return a data URI representation of the buffer
      const mimeType = originalName.endsWith('.png') ? 'image/png' : originalName.endsWith('.jpg') || originalName.endsWith('.jpeg') ? 'image/jpeg' : originalName.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';
      const resourceType = mimeType.startsWith('image/') ? 'image' : 'raw';
      const base64 = fileBuffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;

      return resolve({
        secure_url: dataUrl,
        resource_type: resourceType,
      });
    }

    const stream = cloudinary.uploader.upload_stream(
      { 
        folder: folderName, 
        resource_type: 'auto' // 'auto' allows images, PDFs, ZIPs, etc.
      }, 
      (error, result) => {
        if (error) {
          console.warn('Cloudinary upload error, falling back to data URL:', error.message);
          const base64 = fileBuffer.toString('base64');
          return resolve({
            secure_url: `data:application/octet-stream;base64,${base64}`,
            resource_type: 'raw',
          });
        }
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

module.exports = { upload, uploadToCloudinary };