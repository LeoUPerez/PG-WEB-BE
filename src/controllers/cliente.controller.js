const clienteService = require('../services/cliente.service');

const getAll = async (req, res, next) => {
  try {
    const archived = req.query.archived === 'true';
    const data = await clienteService.findAll({ archived });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await clienteService.findById(req.params.id);
    if (!data) { res.status(404); throw new Error('Cliente no encontrado'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await clienteService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await clienteService.update(req.params.id, req.body);
    if (!data) { res.status(404); throw new Error('Cliente no encontrado'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const archive = async (req, res, next) => {
  try {
    const data = await clienteService.archive(req.params.id);
    if (!data) { res.status(404); throw new Error('Cliente no encontrado'); }
    res.json({ success: true, message: 'Cliente archivado', data });
  } catch (err) { next(err); }
};

const unarchive = async (req, res, next) => {
  try {
    const data = await clienteService.unarchive(req.params.id);
    if (!data) { res.status(404); throw new Error('Cliente no encontrado'); }
    res.json({ success: true, message: 'Cliente restaurado', data });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, archive, unarchive };
