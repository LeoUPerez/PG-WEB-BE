const express = require('express');
const publicController = require('../controllers/public.controller');

const router = express.Router();

router.get('/clases', publicController.getClasesDisponibles);
router.get('/productos', publicController.getProductosPublicos);
router.post('/reservas', publicController.createReserva);
router.get('/reservas/:token', publicController.getReservaPorToken);
router.patch('/reservas/:token/confirmar', publicController.confirmarReservaPorToken);
router.patch('/reservas/:token/cancelar', publicController.cancelarReservaPorToken);

module.exports = router;
