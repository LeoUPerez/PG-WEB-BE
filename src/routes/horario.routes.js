const { Router } = require('express');
const router = Router();
const horarioController = require('../controllers/horario.controller');

router.get('/',                 horarioController.getAll);
router.get('/:id',              horarioController.getById);
router.post('/',                horarioController.create);
router.put('/:id',              horarioController.update);
router.patch('/:id/status',     horarioController.toggleStatus);
router.patch('/:id/archive',    horarioController.archive);
router.patch('/:id/unarchive',  horarioController.unarchive);

module.exports = router;
