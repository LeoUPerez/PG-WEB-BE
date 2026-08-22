const { Router } = require('express');
const router = Router();
const reservaController = require('../controllers/reserva.controller');

router.get('/', reservaController.getAll);
router.get('/:id', reservaController.getById);
router.patch('/:id/confirmar', reservaController.confirmar);
router.patch('/:id/cancelar', reservaController.cancelar);

module.exports = router;
