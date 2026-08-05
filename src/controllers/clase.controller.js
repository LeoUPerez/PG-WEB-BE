const claseService = require('../services/clase.service');

const getAll = async (req, res, next) => {
  try {
    const archived = req.query.archived === 'true';
    const data = await claseService.findAll({ archived });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await claseService.findById(req.params.id);
    if (!data) { res.status(404); throw new Error('Clase no encontrada'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await claseService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await claseService.update(req.params.id, req.body);
    if (!data) { res.status(404); throw new Error('Clase no encontrada'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const toggleStatus = async (req, res, next) => {
  try {
    const { estado } = req.body;
    const data = await claseService.toggleStatus(req.params.id, estado);
    if (!data) { res.status(404); throw new Error('Clase no encontrada'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const archive = async (req, res, next) => {
  try {
    const data = await claseService.archive(req.params.id);
    if (!data) { res.status(404); throw new Error('Clase no encontrada'); }
    res.json({ success: true, message: 'Clase archivada', data });
  } catch (err) { next(err); }
};

const unarchive = async (req, res, next) => {
  try {
    const data = await claseService.unarchive(req.params.id);
    if (!data) { res.status(404); throw new Error('Clase no encontrada'); }
    res.json({ success: true, message: 'Clase restaurada', data });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, toggleStatus, archive, unarchive };
