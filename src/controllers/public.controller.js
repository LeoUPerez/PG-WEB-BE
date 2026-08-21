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
      message: 'Reserva registrada correctamente.',
      data,
    });
  } catch (err) {
    if (err.statusCode) res.status(err.statusCode);
    next(err);
  }
};

module.exports = { getClasesDisponibles, createReserva };
