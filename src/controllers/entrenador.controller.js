const entrenadorService = require('../services/entrenador.service');

const getAll = async (req, res, next) => {
  try {
    const data = await entrenadorService.findAll();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await entrenadorService.findById(req.params.id);
    if (!data) { res.status(404); throw new Error('Entrenador no encontrado'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await entrenadorService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await entrenadorService.update(req.params.id, req.body);
    if (!data) { res.status(404); throw new Error('Entrenador no encontrado'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const archivar = async (req, res, next) => {
  try {
    const data = await entrenadorService.archivar(req.params.id);
    if (!data) { res.status(404); throw new Error('Entrenador no encontrado'); }
    res.json({ success: true, message: 'Entrenador archivado', data });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, archivar };
