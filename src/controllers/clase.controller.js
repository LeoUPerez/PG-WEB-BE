const claseService = require('../services/clase.service');
const { parseListQuery, sendList } = require('../utils/pagination');

const getAll = async (req, res, next) => {
  try {
    const archived = req.query.archived === 'true';
    const { paginated, page, limit, search } = parseListQuery(req.query);
    const result = await claseService.findAll({
      archived,
      page,
      limit,
      search,
      estado: ['Activo', 'Inactivo'].includes(req.query.estado) ? req.query.estado : '',
    });
    sendList(res, result, paginated);
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
  } catch (err) {
    if (err.statusCode) res.status(err.statusCode);
    next(err);
  }
};

const toggleStatus = async (req, res, next) => {
  try {
    const { estado } = req.body;
    const data = await claseService.toggleStatus(req.params.id, estado);
    if (!data) { res.status(404); throw new Error('Clase no encontrada'); }
    res.json({ success: true, data });
  } catch (err) {
    if (err.statusCode) res.status(err.statusCode);
    next(err);
  }
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
