const { Router } = require('express');
const router = Router();
const clienteController = require('../controllers/cliente.controller');

router.get('/', clienteController.getAll);
router.get('/:id', clienteController.getById);
router.post('/', clienteController.create);
router.put('/:id', clienteController.update);
router.patch('/:id/archive', clienteController.archive);
router.patch('/:id/unarchive', clienteController.unarchive);

module.exports = router;
