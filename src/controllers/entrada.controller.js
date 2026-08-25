const entradaService = require('../services/entrada.service');
const { parseListQuery, sendList } = require('../utils/pagination');

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

const getAll = async (req, res, next) => {
  try {
    const { paginated, page, limit, search } = parseListQuery(req.query);
    const result = await entradaService.findAll({
      page,
      limit,
      search,
      estado: ['Pendiente', 'Completada', 'Anulada'].includes(req.query.estado) ? req.query.estado : '',
      fecha_desde: FECHA_RE.test(req.query.fecha_desde) ? req.query.fecha_desde : '',
      fecha_hasta: FECHA_RE.test(req.query.fecha_hasta) ? req.query.fecha_hasta : '',
    });
    sendList(res, result, paginated);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await entradaService.findById(req.params.id);
    if (!data) { res.status(404); throw new Error('Entrada no encontrada'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getProductosActivos = async (req, res, next) => {
  try {
    const data = await entradaService.findProductosActivos({ proveedor_id: req.query.proveedor_id || '' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { proveedor_id, detalle, referencia, estado } = req.body;
    if (!proveedor_id) {
      res.status(400);
      throw new Error('Selecciona un proveedor');
    }
    const data = await entradaService.create({ proveedor_id, detalle, referencia, estado });
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (err.status) res.status(err.status);
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { proveedor_id, detalle, referencia } = req.body;
    if (!proveedor_id) {
      res.status(400);
      throw new Error('Selecciona un proveedor');
    }
    const data = await entradaService.update(req.params.id, { proveedor_id, detalle, referencia });
    if (!data) { res.status(404); throw new Error('Entrada no encontrada'); }
    res.json({ success: true, message: 'Entrada actualizada', data });
  } catch (err) {
    if (err.status) res.status(err.status);
    next(err);
  }
};

const anular = async (req, res, next) => {
  try {
    const data = await entradaService.anular(req.params.id);
    if (!data) { res.status(404); throw new Error('Entrada no encontrada'); }
    res.json({ success: true, message: 'Entrada anulada', data });
  } catch (err) {
    if (err.status) res.status(err.status);
    next(err);
  }
};

const recibir = async (req, res, next) => {
  try {
    const data = await entradaService.recibir(req.params.id);
    if (!data) { res.status(404); throw new Error('Entrada no encontrada'); }
    res.json({ success: true, message: 'Llegada confirmada', data });
  } catch (err) {
    if (err.status) res.status(err.status);
    next(err);
  }
};

module.exports = { getAll, getById, getProductosActivos, create, update, anular, recibir };
