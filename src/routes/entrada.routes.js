const { Router } = require('express');
const router = Router();
const entradaController = require('../controllers/entrada.controller');

router.get('/', entradaController.getAll);
router.get('/productos-activos', entradaController.getProductosActivos);
router.get('/:id', entradaController.getById);
router.post('/', entradaController.create);
router.put('/:id', entradaController.update);
router.patch('/:id/recibir', entradaController.recibir);
router.patch('/:id/anular', entradaController.anular);

module.exports = router;
