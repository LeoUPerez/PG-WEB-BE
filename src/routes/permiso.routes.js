const { Router } = require('express');
const router = Router();
const permisoController = require('../controllers/permiso.controller');

router.get('/', permisoController.getAll);
router.get('/:id', permisoController.getById);

module.exports = router;
