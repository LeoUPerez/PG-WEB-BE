const { Router } = require('express');
const router = Router();
const abonoController = require('../controllers/abono.controller');

router.get('/', abonoController.getAll);
router.get('/cuentas-por-cobrar', abonoController.getCuentasPorCobrar);
router.get('/cliente/:clienteId/cargos', abonoController.getCargosConSaldo);
router.get('/:id', abonoController.getById);
router.post('/', abonoController.registrar);

module.exports = router;
