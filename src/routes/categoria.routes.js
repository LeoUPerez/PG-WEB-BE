const { Router } = require('express');
const router = Router();
const categoriaController = require('../controllers/categoria.controller');

router.get('/', categoriaController.getAll);
router.get('/:id', categoriaController.getById);
router.post('/', categoriaController.create);
router.put('/:id', categoriaController.update);
router.patch('/:id/archive', categoriaController.archive);
router.patch('/:id/unarchive', categoriaController.unarchive);

module.exports = router;
