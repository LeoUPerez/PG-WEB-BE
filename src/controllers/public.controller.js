const publicService = require('../services/public.service');

const getClasesDisponibles = async (req, res, next) => {
  try {
    const data = await publicService.findClasesDisponibles();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getProductosPublicos = async (req, res, next) => {
  try {
    const categoria_id = req.query.categoria_id || '';
    const data = await publicService.findProductosPublicos({ categoria_id });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const createReserva = async (req, res, next) => {
  try {
    const {
      horario_id,
      fecha_clase,
      nombre,
      apellido,
      email,
      telefono,
      notas,
    } = req.body;

    if (!horario_id || !fecha_clase || !nombre || !apellido || !email || !telefono) {
      res.status(400);
      throw new Error('Completa todos los campos obligatorios de la reserva.');
    }

    const data = await publicService.createReserva({
      horario_id: Number(horario_id),
      fecha_clase,
      nombre,
      apellido,
      email,
      telefono,
      notas,
    });

    res.status(201).json({
      success: true,
      message: 'Reserva registrada. Revisa tu correo para confirmar o cancelar tu asistencia.',
      data,
    });
  } catch (err) {
    if (err.statusCode) res.status(err.statusCode);
    next(err);
  }
};

const getReservaPorToken = async (req, res, next) => {
  try {
    const data = await publicService.findReservaByToken(req.params.token);
    if (!data) { res.status(404); throw new Error('Reserva no encontrada.'); }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const confirmarReservaPorToken = async (req, res, next) => {
  try {
    const data = await publicService.confirmarPorToken(req.params.token);
    if (!data) { res.status(404); throw new Error('Reserva no encontrada.'); }
    res.json({ success: true, message: 'Reserva confirmada.', data });
  } catch (err) {
    if (err.statusCode) res.status(err.statusCode);
    next(err);
  }
};

const cancelarReservaPorToken = async (req, res, next) => {
  try {
    const data = await publicService.cancelarPorToken(req.params.token);
    if (!data) { res.status(404); throw new Error('Reserva no encontrada.'); }
    res.json({ success: true, message: 'Reserva cancelada.', data });
  } catch (err) {
    if (err.statusCode) res.status(err.statusCode);
    next(err);
  }
};

const createVentaPublica = async (req, res, next) => {
  try {
    const data = await publicService.createVentaPublica(req.body || {});
    const pagada = data.estado === 'Pagada';
    res.status(201).json({
      success: true,
      message: pagada
        ? 'Pago simulado aprobado. Revisa tu correo con el número de tracking.'
        : 'Pedido registrado. Paga en recepción; te enviamos el tracking por correo.',
      data,
    });
  } catch (err) {
    if (err.statusCode || err.status) res.status(err.statusCode || err.status);
    next(err);
  }
};

const pagarVentaSimulada = async (req, res, next) => {
  try {
    const data = await publicService.pagarVentaSimulada(req.params.token, req.body || {});
    res.json({
      success: true,
      message: 'Pago simulado aprobado.',
      data,
    });
  } catch (err) {
    if (err.statusCode || err.status) res.status(err.statusCode || err.status);
    next(err);
  }
};

const getVentaTracking = async (req, res, next) => {
  try {
    const data = await publicService.findVentaTracking(req.query.q);
    if (!data) {
      res.status(404);
      throw new Error('No encontramos un pedido con ese número de tracking.');
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getCiudadesEntrega = async (req, res, next) => {
  try {
    const data = await publicService.findCiudadesEntrega();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const createSolicitudCobertura = async (req, res, next) => {
  try {
    const data = await publicService.createSolicitudCobertura(req.body || {});
    res.status(201).json({
      success: true,
      message: 'Solicitud registrada. Te avisaremos cuando haya cobertura en esa ciudad.',
      data,
    });
  } catch (err) {
    if (err.statusCode || err.status) res.status(err.statusCode || err.status);
    next(err);
  }
};

module.exports = {
  getClasesDisponibles,
  getProductosPublicos,
  getCiudadesEntrega,
  createSolicitudCobertura,
  createVentaPublica,
  pagarVentaSimulada,
  getVentaTracking,
  createReserva,
  getReservaPorToken,
  confirmarReservaPorToken,
  cancelarReservaPorToken,
};
