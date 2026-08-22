const compraService = require('../services/compra.service');
const { parseListQuery, sendList } = require('../utils/pagination');

const getAll = async (req, res, next) => {
  try {
    const { paginated, page, limit, search } = parseListQuery(req.query);
    const result = await compraService.findAll({
      page,
      limit,
      search,
      estado: ['Completada', 'Anulada'].includes(req.query.estado) ? req.query.estado : '',
    });
    sendList(res, result, paginated);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await compraService.findById(req.params.id);
    if (!data) { res.status(404); throw new Error('Compra no encontrada'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getProductosActivos = async (req, res, next) => {
  try {
    const data = await compraService.findProductosActivos({ proveedor_id: req.query.proveedor_id || '' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { proveedor_id, detalle, estado } = req.body;
    if (!proveedor_id) {
      res.status(400);
      throw new Error('Selecciona un proveedor');
    }
    const data = await compraService.create({ proveedor_id, detalle, estado });
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (err.status) res.status(err.status);
    next(err);
  }
};

const anular = async (req, res, next) => {
  try {
    const data = await compraService.anular(req.params.id);
    if (!data) { res.status(404); throw new Error('Compra no encontrada'); }
    res.json({ success: true, message: 'Compra anulada', data });
  } catch (err) {
    if (err.status) res.status(err.status);
    next(err);
  }
};

const recibir = async (req, res, next) => {
  try {
    const data = await compraService.recibir(req.params.id);
    if (!data) { res.status(404); throw new Error('Compra no encontrada'); }
    res.json({ success: true, message: 'Compra marcada como recibida', data });
  } catch (err) {
    if (err.status) res.status(err.status);
    next(err);
  }
};

module.exports = { getAll, getById, getProductosActivos, create, anular, recibir };
