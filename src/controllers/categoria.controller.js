const categoriaService = require('../services/categoria.service');

const getAll = async (req, res, next) => {
  try {
    const archived = req.query.archived === 'true';
    const data = await categoriaService.findAll({ archived });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await categoriaService.findById(req.params.id);
    if (!data) { res.status(404); throw new Error('Categoría no encontrada'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await categoriaService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await categoriaService.update(req.params.id, req.body);
    if (!data) { res.status(404); throw new Error('Categoría no encontrada'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const archive = async (req, res, next) => {
  try {
    const data = await categoriaService.archive(req.params.id);
    if (!data) { res.status(404); throw new Error('Categoría no encontrada'); }
    res.json({ success: true, message: 'Categoría archivada', data });
  } catch (err) { next(err); }
};

const unarchive = async (req, res, next) => {
  try {
    const data = await categoriaService.unarchive(req.params.id);
    if (!data) { res.status(404); throw new Error('Categoría no encontrada'); }
    res.json({ success: true, message: 'Categoría restaurada', data });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, archive, unarchive };
