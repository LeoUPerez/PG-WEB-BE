const productoService = require('../services/producto.service');
const { parseListQuery, sendList } = require('../utils/pagination');

const getAll = async (req, res, next) => {
  try {
    const { paginated, page, limit, search } = parseListQuery(req.query);
    const result = await productoService.findAll({
      page,
      limit,
      search,
      estado: ['Activo', 'Inactivo'].includes(req.query.estado) ? req.query.estado : '',
      categoria_id: /^\d+$/.test(String(req.query.categoria_id || '')) ? req.query.categoria_id : '',
      stock_bajo: req.query.stock_bajo === '1' || req.query.stock_bajo === 'true',
    });
    sendList(res, result, paginated);
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
