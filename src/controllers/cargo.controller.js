const cargoService = require('../services/cargo.service');

const getAll = async (req, res, next) => {
  try {
    const data = await cargoService.findAll();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await cargoService.findById(req.params.id);
    if (!data) { res.status(404); throw new Error('Cargo no encontrado'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { cliente_id } = req.body;
    if (!cliente_id) { res.status(400); throw new Error('El cliente es requerido'); }
    const data = await cargoService.create({ cliente_id });
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (err.status) res.status(err.status);
    next(err);
  }
};

const cancelar = async (req, res, next) => {
  try {
    const data = await cargoService.cancelar(req.params.id);
    if (!data) { res.status(404); throw new Error('Cargo no encontrado o ya no está pendiente'); }
    res.json({ success: true, message: 'Cargo cancelado', data });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, cancelar };
