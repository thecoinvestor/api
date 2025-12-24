const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { adminMiddleware } = require('../middlewares/auth.middleware');
const multer = require('multer');

const uploader = multer({
  storage: multer.diskStorage({}),
  limits: { fileSize: 5000000 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = /^image\/(jpeg|jpg|png)$|^application\/pdf$/;
    const mimetypeValid = allowedMimeTypes.test(file.mimetype);
    const allowedExtensions = /\.(jpeg|jpg|png|pdf)$/i;
    const extensionValid = file.originalname === 'blob' || allowedExtensions.test(file.originalname);

    if (mimetypeValid && extensionValid) {
      return cb(null, true);
    } else {
      const error = new Error('Only images (JPEG, PNG) and PDF allowed');
      error.statusCode = 400;
      cb(error);
    }
  },
});

router.use(adminMiddleware);

// Users management
router.get('/users', adminController.getAllUsers);
router.patch('/users/:userId/status', adminController.updateUserStatus);

// Document verification
router.get('/documents/pending', adminController.getPendingDocuments);
router.get('/documents/verified', adminController.getVerifiedDocuments);
router.patch('/documents/:userId/verify', adminController.verifyDocuments);
router.patch('/documents/:userId/reject', adminController.rejectDocuments);

// Buy requests management
router.get('/requests/buy', adminController.getBuyRequests);
router.patch('/requests/buy/:requestId/approve', adminController.approveBuyRequest);
router.patch('/requests/buy/:requestId/reject', adminController.rejectBuyRequest);

// Withdrawal requests management
router.get('/requests/withdraw', adminController.getWithdrawRequests);
router.patch('/requests/withdraw/:requestId/approve', adminController.approveWithdrawRequest);
router.patch('/requests/withdraw/:requestId/reject', adminController.rejectWithdrawRequest);

// Manual deposit/withdrawal by admin
router.post('/users/:userId/deposit', adminController.manualDeposit);
router.post('/users/:userId/withdraw', adminController.manualWithdraw);

// Payment methods management
router.get('/payment-methods', adminController.getPaymentMethods);
router.patch(
  '/payment-methods/:methodId',
  (req, res, next) => {
    uploader.single('qrImage')(req, res, (err) => {
      if (err) {
        // console.error('Multer error:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error',
        });
      }
      next();
    });
  },
  adminController.updatePaymentMethod,
);
router.post(
  '/payment-methods',
  (req, res, next) => {
    uploader.single('qrImage')(req, res, (err) => {
      if (err) {
        // console.error('Multer error:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error',
        });
      }
      next();
    });
  },
  adminController.createPaymentMethod,
);
router.delete('/payment-methods/:methodId', adminController.deletePaymentMethod);

module.exports = router;
