const { Router } = require('express');
const router = Router();
const proveedorController = require('../controllers/proveedor.controller');

router.get('/', proveedorController.getAll);
router.get('/:id', proveedorController.getById);
router.post('/', proveedorController.create);
router.put('/:id', proveedorController.update);

module.exports = router;
