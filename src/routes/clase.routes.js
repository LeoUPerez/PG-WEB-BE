const { Router } = require('express');
const router = Router();
const claseController = require('../controllers/clase.controller');

router.get('/',                 claseController.getAll);
router.get('/:id',              claseController.getById);
router.post('/',                claseController.create);
router.put('/:id',              claseController.update);
router.patch('/:id/status',     claseController.toggleStatus);
router.patch('/:id/archive',    claseController.archive);
router.patch('/:id/unarchive',  claseController.unarchive);

module.exports = router;
