const { Router } = require('express');
const router = Router();
const rolController = require('../controllers/rol.controller');

router.get('/', rolController.getAll);
router.get('/name/:name', rolController.getByName);
router.get('/:id', rolController.getById);
router.get('/:id/permissions', rolController.getPermissions);
router.post('/', rolController.create);
router.put('/:id', rolController.update);
router.patch('/:id/status', rolController.toggleStatus);
router.put('/:id/permissions', rolController.assignPermissions);

module.exports = router;
