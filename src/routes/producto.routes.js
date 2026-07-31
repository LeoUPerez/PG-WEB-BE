const { Router } = require('express');
const router = Router();
const productoController = require('../controllers/producto.controller');

router.get('/', productoController.getAll);
router.get('/:id', productoController.getById);
router.post('/', productoController.create);
router.put('/:id', productoController.update);

module.exports = router;
