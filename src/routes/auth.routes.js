const { Router } = require('express');
const router = Router();
const authController = require('../controllers/auth.controller');

router.post('/login', authController.login);
router.post('/solicitar-recuperacion', authController.solicitarRecuperacion);
router.post('/restablecer-password', authController.restablecerPassword);

module.exports = router;
