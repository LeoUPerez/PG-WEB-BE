const productoService = require('../services/producto.service');

const getAll = async (req, res, next) => {
  try {
    const data = await productoService.findAll();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await productoService.findById(req.params.id);
    if (!data) { res.status(404); throw new Error('Producto no encontrado'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await productoService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await productoService.update(req.params.id, req.body);
    if (!data) { res.status(404); throw new Error('Producto no encontrado'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update };
