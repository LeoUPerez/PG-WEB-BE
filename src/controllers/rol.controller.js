const rolService = require('../services/rol.service');

const getAll = async (req, res, next) => {
  try {
    const data = await rolService.findAll();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await rolService.findById(req.params.id);
    if (!data) { res.status(404); throw new Error('Rol no encontrado'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getByName = async (req, res, next) => {
  try {
    const data = await rolService.findByName(req.params.name);
    if (!data) { res.status(404); throw new Error('Rol no encontrado'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getPermissions = async (req, res, next) => {
  try {
    const data = await rolService.findPermissions(req.params.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await rolService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await rolService.update(req.params.id, req.body);
    if (!data) { res.status(404); throw new Error('Rol no encontrado'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const toggleStatus = async (req, res, next) => {
  try {
    const { estado } = req.body;
    const data = await rolService.toggleStatus(req.params.id, estado);
    if (!data) { res.status(404); throw new Error('Rol no encontrado'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const assignPermissions = async (req, res, next) => {
  try {
    const { permiso_ids } = req.body;
    await rolService.assignPermissions(req.params.id, permiso_ids);
    res.json({ success: true, message: 'Permisos actualizados' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, getByName, getPermissions, create, update, toggleStatus, assignPermissions };
