const { Router } = require('express');
const router = Router();
const usuarioController = require('../controllers/usuario.controller');

router.get('/', usuarioController.getAll);
router.get('/:id', usuarioController.getById);
router.post('/', usuarioController.create);
router.put('/:id', usuarioController.update);
router.patch('/:id/status', usuarioController.toggleStatus);
router.delete('/:id', usuarioController.archive);
router.patch('/:id/unarchive', usuarioController.unarchive);

module.exports = router;
