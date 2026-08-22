const publicService = require('../services/public.service');

const getClasesDisponibles = async (req, res, next) => {
  try {
    const data = await publicService.findClasesDisponibles();
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
      cedula,
      email,
      telefono,
      notas,
    } = req.body;

    if (!horario_id || !fecha_clase || !nombre || !apellido || !cedula || !email || !telefono) {
      res.status(400);
      throw new Error('Completa todos los campos obligatorios de la reserva.');
    }

    const data = await publicService.createReserva({
      horario_id: Number(horario_id),
      fecha_clase,
      nombre,
      apellido,
      cedula,
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

module.exports = {
  getClasesDisponibles,
  createReserva,
  getReservaPorToken,
  confirmarReservaPorToken,
  cancelarReservaPorToken,
};
