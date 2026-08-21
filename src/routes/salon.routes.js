const { Router } = require('express');
const router = Router();
const salonController = require('../controllers/salon.controller');

router.get('/', salonController.getAll);
router.get('/:id', salonController.getById);
router.post('/', salonController.create);
router.put('/:id', salonController.update);
router.patch('/:id/archive', salonController.archive);
router.patch('/:id/unarchive', salonController.unarchive);

module.exports = router;
