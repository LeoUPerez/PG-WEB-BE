const horarioService = require('../services/horario.service');

const getAll = async (req, res, next) => {
  try {
    const archived = req.query.archived === 'true';
    const data = await horarioService.findAll({ archived });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await horarioService.findById(req.params.id);
    if (!data) { res.status(404); throw new Error('Horario no encontrado'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await horarioService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (err.statusCode) res.status(err.statusCode);
    next(err);
  }
};

const createBulk = async (req, res, next) => {
  try {
    const { clase_id, entrenador_id, salon_id, estado, dias } = req.body;
    if (!clase_id || !entrenador_id || !salon_id || !Array.isArray(dias) || dias.length === 0) {
      res.status(400);
      throw new Error('Clase, entrenador, salón y al menos un día son requeridos');
    }
    const data = await horarioService.createBulk({ clase_id, entrenador_id, salon_id, estado, dias });
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (err.statusCode) res.status(err.statusCode);
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await horarioService.update(req.params.id, req.body);
    if (!data) { res.status(404); throw new Error('Horario no encontrado'); }
    res.json({ success: true, data });
  } catch (err) {
    if (err.statusCode) res.status(err.statusCode);
    next(err);
  }
};

const toggleStatus = async (req, res, next) => {
  try {
    const { estado } = req.body;
    const data = await horarioService.toggleStatus(req.params.id, estado);
    if (!data) { res.status(404); throw new Error('Horario no encontrado'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const archive = async (req, res, next) => {
  try {
    const data = await horarioService.archive(req.params.id);
    if (!data) { res.status(404); throw new Error('Horario no encontrado'); }
    res.json({ success: true, message: 'Horario archivado', data });
  } catch (err) { next(err); }
};

const unarchive = async (req, res, next) => {
  try {
    const data = await horarioService.unarchive(req.params.id);
    if (!data) { res.status(404); throw new Error('Horario no encontrado'); }
    res.json({ success: true, message: 'Horario restaurado', data });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, createBulk, update, toggleStatus, archive, unarchive };
