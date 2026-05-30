const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController');
const authenticate = require('../middleware/auth');

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/user', authenticate, authController.getCurrentUser);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/profile/image', authenticate, upload.single('profileImage'), authController.uploadProfileImage);

module.exports = router;
