const { Router } = require('express');
const router = Router();
const rolController = require('../controllers/rol.controller');

router.get('/', rolController.getAll);
router.get('/:id', rolController.getById);
router.post('/', rolController.create);
router.put('/:id', rolController.update);
router.patch('/:id/estado', rolController.cambiarEstado);
router.put('/:id/permisos', rolController.asignarPermisos);

module.exports = router;
