const express = require('express');
const publicController = require('../controllers/public.controller');

const router = express.Router();

router.get('/clases', publicController.getClasesDisponibles);
router.post('/reservas', publicController.createReserva);

module.exports = router;
