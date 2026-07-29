const permisoService = require('../services/permiso.service');

const getAll = async (req, res, next) => {
  try {
    const data = await permisoService.findAll();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await permisoService.findById(req.params.id);
    if (!data) { res.status(404); throw new Error('Permiso no encontrado'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById };
