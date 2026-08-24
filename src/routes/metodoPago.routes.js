const { Router } = require('express');
const router = Router();
const metodoPagoController = require('../controllers/metodoPago.controller');

router.get('/', metodoPagoController.getAll);
router.get('/:id', metodoPagoController.getById);
router.post('/', metodoPagoController.create);
router.put('/:id', metodoPagoController.update);
router.patch('/:id/status', metodoPagoController.toggleStatus);

module.exports = router;
