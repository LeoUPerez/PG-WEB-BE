const membresiaService = require('../services/membresia.service');
const { parseListQuery, sendList } = require('../utils/pagination');

const getAll = async (req, res, next) => {
  try {
    const archived = req.query.archived === 'true';
    const { paginated, page, limit, search } = parseListQuery(req.query);
    const result = await membresiaService.findAll({
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
    const data = await membresiaService.findById(req.params.id);
    if (!data) { res.status(404); throw new Error('Membresía no encontrada'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await membresiaService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await membresiaService.update(req.params.id, req.body);
    if (!data) { res.status(404); throw new Error('Membresía no encontrada'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const data = await membresiaService.remove(req.params.id);
    if (!data) { res.status(404); throw new Error('Membresía no encontrada'); }
    res.json({ success: true, message: 'Membresía eliminada', data });
  } catch (err) { next(err); }
};

const archive = async (req, res, next) => {
  try {
    const data = await membresiaService.archive(req.params.id);
    if (!data) { res.status(404); throw new Error('Membresía no encontrada'); }
    res.json({ success: true, message: 'Membresía archivada', data });
  } catch (err) { next(err); }
};

const unarchive = async (req, res, next) => {
  try {
    const data = await membresiaService.unarchive(req.params.id);
    if (!data) { res.status(404); throw new Error('Membresía no encontrada'); }
    res.json({ success: true, message: 'Membresía restaurada', data });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove, archive, unarchive };
