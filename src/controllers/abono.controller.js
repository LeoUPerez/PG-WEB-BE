const abonoService = require('../services/abono.service');

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

const getAll = async (req, res, next) => {
  try {
    const paginated = req.query.page !== undefined || req.query.limit !== undefined;
    const result = await abonoService.findAll({
      page: paginated ? req.query.page : null,
      limit: paginated ? req.query.limit : null,
      search: String(req.query.search || '').trim(),
      fecha_desde: FECHA_RE.test(req.query.fecha_desde || '') ? req.query.fecha_desde : '',
      fecha_hasta: FECHA_RE.test(req.query.fecha_hasta || '') ? req.query.fecha_hasta : '',
      cliente_id: req.query.cliente_id ? Number(req.query.cliente_id) : '',
    });
    if (paginated) { res.json({ success: true, ...result }); return; }
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await abonoService.findById(req.params.id);
    if (!data) { res.status(404); throw new Error('Abono no encontrado'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getCargosConSaldo = async (req, res, next) => {
  try {
    const data = await abonoService.findCargosConSaldo(req.params.clienteId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getCuentasPorCobrar = async (req, res, next) => {
  try {
    const data = await abonoService.findCuentasPorCobrar();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const registrar = async (req, res, next) => {
  try {
    const cargo_id = Number(req.body.cargo_id);
    const metodo_pago_id = Number(req.body.metodo_pago_id);
    const monto = Number(req.body.monto);
    if (!cargo_id || !metodo_pago_id) { res.status(400); throw new Error('Cargo y método de pago son requeridos'); }
    const resultado = await abonoService.registrar({
      cargo_id,
      metodo_pago_id,
      monto,
      comprobante_url: req.body.comprobante_url || null,
      created_by: req.body.created_by || null,
    });
    const data = await abonoService.findById(resultado.id);
    res.status(201).json({ success: true, data, saldoRestante: resultado.saldoRestante });
  } catch (err) {
    if (err.status) res.status(err.status);
    next(err);
  }
};

module.exports = { getAll, getById, getCargosConSaldo, getCuentasPorCobrar, registrar };
