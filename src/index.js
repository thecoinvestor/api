const mongoose = require('mongoose');
const app = require('../src/app.js');
const config = require('../src/config/config.js');

// Connect to MongoDB for Vercel
if (mongoose.connection.readyState === 0) {
  mongoose.connect(config.mongoose.url, config.mongoose.options);
}

// Export for Vercel
module.exports = app;
