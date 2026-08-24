const { Router } = require('express');
const router = Router();
const cobroController = require('../controllers/cobro.controller');

router.get('/', cobroController.getAll);
router.get('/metodos-pago', cobroController.getMetodosPago);
router.get('/cliente/:clienteId/pendientes', cobroController.getPendientesByCliente);
router.get('/pago/:token', cobroController.getByToken);
router.patch('/pago/:token/procesar', cobroController.procesarPago);
router.get('/:id', cobroController.getById);
router.post('/', cobroController.create);
router.patch('/:id/anular', cobroController.anular);

module.exports = router;
