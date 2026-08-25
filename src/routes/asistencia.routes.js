const { Router } = require('express');
const router = Router();
const asistenciaController = require('../controllers/asistencia.controller');

router.get('/', asistenciaController.getAll);
router.get('/buscar', asistenciaController.buscar);
router.post('/', asistenciaController.registrarEntrada);
router.patch('/:id/salida', asistenciaController.registrarSalida);

module.exports = router;
