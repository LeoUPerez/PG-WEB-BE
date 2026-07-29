const { Router } = require('express');
const router = Router();
const clienteController = require('../controllers/cliente.controller');

router.get('/', clienteController.getAll);
router.get('/:id', clienteController.getById);
router.post('/', clienteController.create);
router.put('/:id', clienteController.update);
router.patch('/:id/archivar', clienteController.archivar);

module.exports = router;
