const { Router } = require('express');
const router = Router();
const cargoController = require('../controllers/cargo.controller');

router.get('/', cargoController.getAll);
router.get('/:id', cargoController.getById);
router.post('/', cargoController.create);
router.patch('/:id/cancelar', cargoController.cancelar);

module.exports = router;
