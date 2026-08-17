const cobroService = require('../services/cobro.service');

const getAll = async (req, res, next) => {
  try {
    const data = await cobroService.findAll();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await cobroService.findById(req.params.id);
    if (!data) { res.status(404); throw new Error('Cobro no encontrado'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getPendientesByCliente = async (req, res, next) => {
  try {
    const data = await cobroService.findPendientesByCliente(req.params.clienteId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getMetodosPago = async (req, res, next) => {
  try {
    const data = await cobroService.findMetodosPago();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { cliente_id, metodo_pago_id, cargo_ids } = req.body;
    if (!cliente_id || !metodo_pago_id) {
      res.status(400);
      throw new Error('Cliente y método de pago son requeridos');
    }
    const data = await cobroService.create({ cliente_id, metodo_pago_id, cargo_ids });
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (err.status) res.status(err.status);
    next(err);
  }
};

module.exports = { getAll, getById, getPendientesByCliente, getMetodosPago, create };
