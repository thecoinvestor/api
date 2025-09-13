const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware } = require('../middlewares/auth.middleware');
const profileController = require('../controllers/profile.controller');

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
    }
});

router.use(authMiddleware);

router.post('/upload', (req, res, next) => {
    uploader.single('file')(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({
                success: false,
                message: err.message || 'File upload error'
            });
        }
        next();
    });
}, profileController.uploadFile);

router.post('/buy', (req, res, next) => {
    uploader.single('proofOfPayment')(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({
                success: false,
                message: err.message || 'File upload error'
            });
        }
        next();
    });
}, profileController.Buy);

router.post('/withdraw', profileController.Withdraw);
router.get('/dashboard', profileController.getDashboardData);

module.exports = router;