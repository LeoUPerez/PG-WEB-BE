const { Router } = require('express');
const router = Router();
const membresiaController = require('../controllers/membresia.controller');

router.get('/', membresiaController.getAll);
router.get('/:id', membresiaController.getById);
router.post('/', membresiaController.create);
router.put('/:id', membresiaController.update);
router.delete('/:id', membresiaController.remove);
router.patch('/:id/archive', membresiaController.archive);
router.patch('/:id/unarchive', membresiaController.unarchive);

module.exports = router;
