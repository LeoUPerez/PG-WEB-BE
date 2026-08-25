const express = require('express');
const publicController = require('../controllers/public.controller');

const router = express.Router();

router.get('/clases', publicController.getClasesDisponibles);
router.get('/productos', publicController.getProductosPublicos);
router.get('/ciudades-entrega', publicController.getCiudadesEntrega);
router.post('/solicitudes-cobertura', publicController.createSolicitudCobertura);
router.post('/ventas', publicController.createVentaPublica);
router.post('/ventas/:token/pagar-simulado', publicController.pagarVentaSimulada);
router.get('/ventas/tracking', publicController.getVentaTracking);
router.post('/reservas', publicController.createReserva);
router.get('/reservas/:token', publicController.getReservaPorToken);
router.patch('/reservas/:token/confirmar', publicController.confirmarReservaPorToken);
router.patch('/reservas/:token/cancelar', publicController.cancelarReservaPorToken);

module.exports = router;
