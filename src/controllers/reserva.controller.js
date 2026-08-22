const reservaService = require('../services/reserva.service');
const { parseListQuery, sendList } = require('../utils/pagination');

const getAll = async (req, res, next) => {
  try {
    const { paginated, page, limit, search } = parseListQuery(req.query);
    const result = await reservaService.findAll({
      page,
      limit,
      search,
      estado: ['Pendiente', 'Confirmada', 'Cancelada'].includes(req.query.estado) ? req.query.estado : '',
    });
    sendList(res, result, paginated);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await reservaService.findById(req.params.id);
    if (!data) { res.status(404); throw new Error('Reserva no encontrada'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const confirmar = async (req, res, next) => {
  try {
    const data = await reservaService.confirmar(req.params.id);
    if (!data) { res.status(404); throw new Error('Reserva no encontrada'); }
    res.json({ success: true, message: 'Reserva confirmada', data });
  } catch (err) {
    if (err.status) res.status(err.status);
    next(err);
  }
};

const cancelar = async (req, res, next) => {
  try {
    const data = await reservaService.cancelar(req.params.id);
    if (!data) { res.status(404); throw new Error('Reserva no encontrada'); }
    res.json({ success: true, message: 'Reserva cancelada', data });
  } catch (err) {
    if (err.status) res.status(err.status);
    next(err);
  }
};

module.exports = { getAll, getById, confirmar, cancelar };
