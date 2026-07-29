const { Router } = require('express');
const router = Router();
const entrenadorController = require('../controllers/entrenador.controller');

router.get('/', entrenadorController.getAll);
router.get('/:id', entrenadorController.getById);
router.post('/', entrenadorController.create);
router.put('/:id', entrenadorController.update);
router.patch('/:id/archivar', entrenadorController.archivar);

module.exports = router;
