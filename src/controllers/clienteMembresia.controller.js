const clienteMembresiaService = require('../services/clienteMembresia.service');

const getAll = async (req, res, next) => {
  try {
    const data = await clienteMembresiaService.findAll();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await clienteMembresiaService.findById(req.params.id);
    if (!data) { res.status(404); throw new Error('Asignación no encontrada'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getActivaByCliente = async (req, res, next) => {
  try {
    const data = await clienteMembresiaService.findActivaByCliente(req.params.clienteId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { cliente_id, membresia_id, fecha_inicio } = req.body;
    if (!cliente_id || !membresia_id || !fecha_inicio) {
      res.status(400);
      throw new Error('Cliente, membresía y fecha de inicio son requeridos');
    }
    const data = await clienteMembresiaService.create({ cliente_id, membresia_id, fecha_inicio });
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (err.status) res.status(err.status);
    next(err);
  }
};

const cancelar = async (req, res, next) => {
  try {
    const data = await clienteMembresiaService.cancelar(req.params.id);
    if (!data) { res.status(404); throw new Error('Asignación no encontrada'); }
    res.json({ success: true, message: 'Asignación cancelada', data });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, getActivaByCliente, create, cancelar };
