const config = require('../config/config');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: config.cloudinary.name,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

const uploadFileToCloudinary = async (filePath) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'user-documents',
    resource_type: 'auto',
  });
  return result;
};

module.exports = uploadFileToCloudinary;
