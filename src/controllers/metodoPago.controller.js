const metodoPagoService = require('../services/metodoPago.service');

const getAll = async (req, res, next) => {
  try {
    const estado = ['Activo', 'Inactivo'].includes(req.query.estado) ? req.query.estado : '';
    const data = await metodoPagoService.findAll({ estado });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await metodoPagoService.findById(req.params.id);
    if (!data) { res.status(404); throw new Error('Método de pago no encontrado'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { nombre, estado } = req.body;
    if (!nombre) { res.status(400); throw new Error('El nombre es requerido'); }
    const data = await metodoPagoService.create({ nombre, estado });
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { nombre, estado } = req.body;
    if (!nombre) { res.status(400); throw new Error('El nombre es requerido'); }
    const data = await metodoPagoService.update(req.params.id, { nombre, estado });
    if (!data) { res.status(404); throw new Error('Método de pago no encontrado'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const toggleStatus = async (req, res, next) => {
  try {
    const estado = req.body.estado === 'Inactivo' ? 'Inactivo' : 'Activo';
    const data = await metodoPagoService.toggleStatus(req.params.id, estado);
    if (!data) { res.status(404); throw new Error('Método de pago no encontrado'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, toggleStatus };
