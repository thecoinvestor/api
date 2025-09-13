const httpStatus = require('http-status');
const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.status(httpStatus.OK).json({ status: 'OK' });
});

router.use('/profile', require('./profile.routes'));

module.exports = router;
