const { Router } = require('express');
const router = Router();
const ventaController = require('../controllers/venta.controller');

router.get('/', ventaController.getAll);
router.get('/productos-activos', ventaController.getProductosActivos);
router.get('/:id', ventaController.getById);
router.post('/', ventaController.create);
router.patch('/:id/confirmar-pago', ventaController.confirmarPago);
router.patch('/:id/anular', ventaController.anular);
router.patch('/:id/tracking', ventaController.actualizarTracking);
router.patch('/:id/avance-camion', ventaController.avanceCamion);

module.exports = router;
