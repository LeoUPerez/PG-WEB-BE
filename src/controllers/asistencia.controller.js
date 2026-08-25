const asistenciaService = require('../services/asistencia.service');

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

const getAll = async (req, res, next) => {
  try {
    const paginated = req.query.page !== undefined || req.query.limit !== undefined;
    const result = await asistenciaService.findAll({
      page: paginated ? req.query.page : null,
      limit: paginated ? req.query.limit : null,
      search: String(req.query.search || '').trim(),
      fecha: FECHA_RE.test(req.query.fecha || '') ? req.query.fecha : '',
    });

    if (paginated) {
      res.json({ success: true, ...result });
      return;
    }
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const buscar = async (req, res, next) => {
  try {
    const data = await asistenciaService.buscarClientes(req.query.search);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const registrarEntrada = async (req, res, next) => {
  try {
    const cliente_id = Number(req.body.cliente_id);
    if (!cliente_id) { res.status(400); throw new Error('cliente_id es requerido'); }
    const data = await asistenciaService.registrarEntrada({ cliente_id, created_by: req.body.created_by || null });
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (err.status) res.status(err.status);
    next(err);
  }
};

const registrarSalida = async (req, res, next) => {
  try {
    const data = await asistenciaService.registrarSalida(req.params.id);
    if (!data) { res.status(404); throw new Error('No hay una entrada abierta con ese id'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { getAll, buscar, registrarEntrada, registrarSalida };
