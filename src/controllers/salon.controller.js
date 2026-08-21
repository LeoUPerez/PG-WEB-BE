const salonService = require('../services/salon.service');
const { parseListQuery, sendList } = require('../utils/pagination');

const getAll = async (req, res, next) => {
  try {
    const archived = req.query.archived === 'true';
    const { paginated, page, limit, search } = parseListQuery(req.query);
    const result = await salonService.findAll({
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
    const data = await salonService.findById(req.params.id);
    if (!data) { res.status(404); throw new Error('Salón no encontrado'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await salonService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (err.statusCode) res.status(err.statusCode);
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await salonService.update(req.params.id, req.body);
    if (!data) { res.status(404); throw new Error('Salón no encontrado'); }
    res.json({ success: true, data });
  } catch (err) {
    if (err.statusCode) res.status(err.statusCode);
    next(err);
  }
};

const archive = async (req, res, next) => {
  try {
    const data = await salonService.archive(req.params.id);
    if (!data) { res.status(404); throw new Error('Salón no encontrado'); }
    res.json({ success: true, message: 'Salón archivado', data });
  } catch (err) {
    if (err.statusCode) res.status(err.statusCode);
    next(err);
  }
};

const unarchive = async (req, res, next) => {
  try {
    const data = await salonService.unarchive(req.params.id);
    if (!data) { res.status(404); throw new Error('Salón no encontrado'); }
    res.json({ success: true, message: 'Salón restaurado', data });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, archive, unarchive };
