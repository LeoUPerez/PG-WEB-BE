const ventaService = require('../services/venta.service');
const { parseListQuery, sendList } = require('../utils/pagination');

const getAll = async (req, res, next) => {
  try {
    const { paginated, page, limit, search } = parseListQuery(req.query);
    const estado = ['Pendiente', 'Pagada', 'Anulada', 'Entregada'].includes(req.query.estado)
      ? req.query.estado
      : '';
    const result = await ventaService.findAll({ page, limit, search, estado });
    sendList(res, result, paginated);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await ventaService.findById(req.params.id);
    if (!data) {
      res.status(404);
      throw new Error('Venta no encontrada');
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getProductosActivos = async (req, res, next) => {
  try {
    const data = await ventaService.findProductosActivos();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await ventaService.create({
      origen: req.body.origen || 'Recepcion',
      comprador_nombre: req.body.comprador_nombre,
      comprador_apellido: req.body.comprador_apellido,
      comprador_email: req.body.comprador_email,
      comprador_telefono: req.body.comprador_telefono,
      comprador_cedula: req.body.comprador_cedula,
      tipo_entrega: req.body.tipo_entrega || 'RetiroGym',
      direccion_entrega: req.body.direccion_entrega,
      ciudad_id: req.body.ciudad_id,
      ciudad_nombre: req.body.ciudad_nombre,
      sector: req.body.sector,
      calle: req.body.calle,
      numero_casa: req.body.numero_casa,
      referencias: req.body.referencias,
      estado: req.body.estado || 'Pendiente',
      metodo_pago: req.body.metodo_pago,
      detalle: req.body.detalle,
    });
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (err.status) res.status(err.status);
    next(err);
  }
};

const confirmarPago = async (req, res, next) => {
  try {
    const data = await ventaService.confirmarPago(req.params.id, {
      metodo_pago: req.body.metodo_pago,
    });
    if (!data) {
      res.status(404);
      throw new Error('Venta no encontrada');
    }
    res.json({ success: true, message: 'Pago confirmado', data });
  } catch (err) {
    if (err.status) res.status(err.status);
    next(err);
  }
};

const anular = async (req, res, next) => {
  try {
    const data = await ventaService.anular(req.params.id);
    if (!data) {
      res.status(404);
      throw new Error('Venta no encontrada');
    }
    res.json({ success: true, message: 'Venta anulada', data });
  } catch (err) {
    if (err.status) res.status(err.status);
    next(err);
  }
};

const actualizarTracking = async (req, res, next) => {
  try {
    const data = await ventaService.actualizarTracking(req.params.id, {
      tracking_status: req.body.tracking_status,
      porcentaje_entrega: req.body.porcentaje_entrega,
    });
    if (!data) {
      res.status(404);
      throw new Error('Venta no encontrada');
    }
    res.json({ success: true, message: 'Tracking actualizado', data });
  } catch (err) {
    if (err.status) res.status(err.status);
    next(err);
  }
};

const avanceCamion = async (req, res, next) => {
  try {
    const data = await ventaService.avanceCamion(req.params.id, {
      delta: req.body.delta,
    });
    if (!data) {
      res.status(404);
      throw new Error('Venta no encontrada');
    }
    res.json({ success: true, message: 'Avance del camión actualizado', data });
  } catch (err) {
    if (err.status) res.status(err.status);
    next(err);
  }
};

module.exports = {
  getAll,
  getById,
  getProductosActivos,
  create,
  confirmarPago,
  anular,
  actualizarTracking,
  avanceCamion,
};
