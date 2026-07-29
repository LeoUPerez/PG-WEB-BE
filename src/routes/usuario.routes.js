const { Router } = require('express');
const router = Router();
const usuarioController = require('../controllers/usuario.controller');

router.get('/', usuarioController.getAll);
router.get('/:id', usuarioController.getById);
router.post('/', usuarioController.create);
router.put('/:id', usuarioController.update);
router.patch('/:id/estado', usuarioController.cambiarEstado);
router.delete('/:id', usuarioController.archivar);

module.exports = router;
