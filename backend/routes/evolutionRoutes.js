const express = require('express');
const router = express.Router();
const evolutionController = require('../controllers/EvolutionController');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.get('/qr/:instanceName', evolutionController.getQRCode);
router.get('/pairing/:instanceName', evolutionController.getPairingCode);
router.get('/status/:instanceName', evolutionController.getInstanceStatus);
router.post('/logout/:instanceName', evolutionController.logoutInstance);

module.exports = router;
