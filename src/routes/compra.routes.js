const { Router } = require('express');
const router = Router();
const compraController = require('../controllers/compra.controller');

router.get('/', compraController.getAll);
router.get('/productos-activos', compraController.getProductosActivos);
router.get('/:id', compraController.getById);
router.post('/', compraController.create);
router.patch('/:id/anular', compraController.anular);
router.patch('/:id/recibir', compraController.recibir);

module.exports = router;
