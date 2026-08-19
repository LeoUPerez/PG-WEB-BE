const { Router } = require('express');
const router = Router();
const clienteMembresiaController = require('../controllers/clienteMembresia.controller');

router.get('/', clienteMembresiaController.getAll);
router.get('/resumen-clientes', clienteMembresiaController.getUltimaPorCliente);
router.get('/cliente/:clienteId/activa', clienteMembresiaController.getActivaByCliente);
router.get('/cliente/:clienteId/ultima', clienteMembresiaController.getUltimaByCliente);
router.get('/:id', clienteMembresiaController.getById);
router.post('/', clienteMembresiaController.create);
router.patch('/:id/cancelar', clienteMembresiaController.cancelar);

module.exports = router;
