const crypto = require('crypto');
const pool = require('../config/db');
const emailService = require('./email.service');

const DIA_ORDER = `
  CASE h.dia
    WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miércoles' THEN 3
    WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 WHEN 'Sábado' THEN 6
    WHEN 'Domingo' THEN 7 ELSE 8
  END
`;

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const findClasesDisponibles = async () => {
  const { rows } = await pool.query(
    `SELECT
       h.id AS horario_id,
       h.dia,
       TO_CHAR(h.hora_inicio, 'HH24:MI') AS hora_inicio,
       TO_CHAR(h.hora_fin, 'HH24:MI') AS hora_fin,
       c.id AS clase_id,
       c.nombre,
       c.descripcion,
       c.capacidad,
       LEAST(c.capacidad, COALESCE(s.capacidad, c.capacidad)) AS cupos,
       c.duracion_minutos,
       TRIM(CONCAT(e.nombre, ' ', e.apellido)) AS entrenador_nombre,
       s.nombre AS salon_nombre
     FROM horarios_clases h
     INNER JOIN clases c ON c.id = h.clase_id
     INNER JOIN entrenadores e ON e.id = h.entrenador_id
     INNER JOIN salones s ON s.id = h.salon_id
     WHERE h.archivado = false
       AND h.estado = 'Activo'
       AND c.archivado = false
       AND c.estado = 'Activo'
       AND e.archivado = false
       AND e.estado = 'Activo'
       AND s.archivado = false
       AND s.estado = 'Activo'
     ORDER BY ${DIA_ORDER}, h.hora_inicio ASC`
  );

  return rows;
};

const countReservasActivas = async (horarioId, fechaClase) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM reservas_clases
     WHERE horario_id = $1
       AND fecha_clase = $2
       AND estado IN ('Pendiente', 'Confirmada')`,
    [horarioId, fechaClase]
  );
  return rows[0]?.total ?? 0;
};

const findHorarioActivo = async (horarioId) => {
  const { rows } = await pool.query(
    `SELECT
       h.id AS horario_id,
       h.dia,
       TO_CHAR(h.hora_inicio, 'HH24:MI') AS hora_inicio,
       TO_CHAR(h.hora_fin, 'HH24:MI') AS hora_fin,
       c.id AS clase_id,
       c.nombre,
       c.capacidad,
       LEAST(c.capacidad, COALESCE(s.capacidad, c.capacidad)) AS cupos,
       TRIM(CONCAT(e.nombre, ' ', e.apellido)) AS entrenador_nombre,
       s.nombre AS salon_nombre
     FROM horarios_clases h
     INNER JOIN clases c ON c.id = h.clase_id
     INNER JOIN entrenadores e ON e.id = h.entrenador_id
     INNER JOIN salones s ON s.id = h.salon_id
     WHERE h.id = $1
       AND h.archivado = false
       AND h.estado = 'Activo'
       AND c.archivado = false
       AND c.estado = 'Activo'
       AND e.archivado = false
       AND e.estado = 'Activo'
       AND s.archivado = false
       AND s.estado = 'Activo'`,
    [horarioId]
  );
  return rows[0] || null;
};

const formatearHora12 = (horaHHMM) => {
  const [h, m] = String(horaHHMM || '').split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return horaHHMM || '';
  const periodo = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${periodo}`;
};

const formatearRangoHora = (inicio, fin) => `${formatearHora12(inicio)} – ${formatearHora12(fin)}`;

const formatearFecha = (fechaClase) => {
  const [anio, mes, dia] = String(fechaClase).split('-');
  return `${dia}/${mes}/${anio}`;
};

const fechaCoincideConDia = (fechaClase, dia) => {
  const date = new Date(`${fechaClase}T12:00:00`);
  return DIAS_SEMANA[date.getDay()] === dia;
};

const findClienteByCedula = async (cedula) => {
  const { rows } = await pool.query(
    `SELECT id, nombre, apellido, email, telefono FROM clientes WHERE cedula = $1 AND archivado = false LIMIT 1`,
    [cedula]
  );
  return rows[0] || null;
};

const normalizarTexto = (valor) =>
  String(valor || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();

const createReserva = async ({
  horario_id,
  fecha_clase,
  nombre,
  apellido,
  cedula,
  email,
  telefono,
  notas = null,
}) => {
  const horario = await findHorarioActivo(horario_id);
  if (!horario) {
    const error = new Error('El horario seleccionado no está disponible.');
    error.statusCode = 404;
    throw error;
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(`${fecha_clase}T12:00:00`);
  if (Number.isNaN(fecha.getTime()) || fecha < hoy) {
    const error = new Error('La fecha de la clase debe ser hoy o posterior.');
    error.statusCode = 400;
    throw error;
  }

  if (!fechaCoincideConDia(fecha_clase, horario.dia)) {
    const error = new Error(`La fecha debe corresponder a un ${horario.dia}.`);
    error.statusCode = 400;
    throw error;
  }

  const cliente = await findClienteByCedula(cedula.trim());
  if (!cliente) {
    const error = new Error('Debes estar inscrito como cliente del gimnasio para reservar una clase.');
    error.statusCode = 403;
    throw error;
  }
  if (
    normalizarTexto(cliente.nombre) !== normalizarTexto(nombre) ||
    normalizarTexto(cliente.apellido) !== normalizarTexto(apellido)
  ) {
    const error = new Error('El nombre y apellido no coinciden con el cliente registrado con esta cédula.');
    error.statusCode = 403;
    throw error;
  }
  const clienteId = cliente.id;

  const reservasActivas = await countReservasActivas(horario_id, fecha_clase);
  if (reservasActivas >= horario.cupos) {
    const error = new Error('No hay cupos disponibles para esta clase.');
    error.statusCode = 409;
    throw error;
  }

  const token = crypto.randomBytes(32).toString('hex');

  let rows;
  try {
    ({ rows } = await pool.query(
      `INSERT INTO reservas_clases
         (horario_id, fecha_clase, nombre, apellido, cedula, email, telefono, notas, cliente_id, token)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, horario_id, fecha_clase, nombre, apellido, cedula, email, telefono, notas, estado, created_at`,
      [
        horario_id,
        fecha_clase,
        cliente.nombre,
        cliente.apellido,
        cedula.trim(),
        cliente.email,
        cliente.telefono,
        notas?.trim() || null,
        clienteId,
        token,
      ]
    ));
  } catch (err) {
    if (err.code === '23505' && err.constraint === 'uq_reservas_clases_slot_activa') {
      const error = new Error('Ya tienes una reserva pendiente o confirmada para esta clase en esta fecha.');
      error.statusCode = 409;
      throw error;
    }
    throw err;
  }

  const link = `${(process.env.FRONTEND_URL || '').replace(/\/$/, '')}/confirmar_reserva.php?token=${token}`;
  try {
    await emailService.enviarConfirmacionReserva({
      destinatario: cliente.email,
      nombre: cliente.nombre,
      clase: horario.nombre,
      dia: horario.dia,
      rango: formatearRangoHora(horario.hora_inicio, horario.hora_fin),
      fecha: formatearFecha(fecha_clase),
      entrenador: horario.entrenador_nombre,
      salon: horario.salon_nombre,
      link,
    });
  } catch (err) {
    console.error('No se pudo enviar el correo de confirmación de reserva:', err.message);
  }

  return {
    ...rows[0],
    clase_nombre: horario.nombre,
    dia: horario.dia,
  };
};

const SELECT_RESERVA_TOKEN = `
  SELECT r.id, r.fecha_clase, r.nombre, r.apellido, r.estado, r.token,
         h.dia,
         TO_CHAR(h.hora_inicio, 'HH24:MI') AS hora_inicio,
         TO_CHAR(h.hora_fin, 'HH24:MI') AS hora_fin,
         c.nombre AS clase_nombre,
         TRIM(CONCAT(e.nombre, ' ', e.apellido)) AS entrenador_nombre,
         s.nombre AS salon_nombre
  FROM reservas_clases r
  JOIN horarios_clases h ON h.id = r.horario_id
  JOIN clases c ON c.id = h.clase_id
  JOIN entrenadores e ON e.id = h.entrenador_id
  LEFT JOIN salones s ON s.id = h.salon_id
`;

const findReservaByToken = async (token) => {
  const { rows } = await pool.query(`${SELECT_RESERVA_TOKEN} WHERE r.token = $1`, [token]);
  return rows[0] || null;
};

const confirmarPorToken = async (token) => {
  const { rows: reservaRows } = await pool.query('SELECT * FROM reservas_clases WHERE token = $1', [token]);
  const reserva = reservaRows[0];
  if (!reserva) return null;
  if (reserva.estado !== 'Pendiente') {
    const error = new Error('Esta reserva ya fue procesada.');
    error.statusCode = 400;
    throw error;
  }
  await pool.query("UPDATE reservas_clases SET estado = 'Confirmada', updated_at = NOW() WHERE token = $1", [token]);
  return findReservaByToken(token);
};

const cancelarPorToken = async (token) => {
  const { rows: reservaRows } = await pool.query('SELECT * FROM reservas_clases WHERE token = $1', [token]);
  const reserva = reservaRows[0];
  if (!reserva) return null;
  if (reserva.estado === 'Cancelada') {
    const error = new Error('Esta reserva ya está cancelada.');
    error.statusCode = 400;
    throw error;
  }
  await pool.query("UPDATE reservas_clases SET estado = 'Cancelada', updated_at = NOW() WHERE token = $1", [token]);
  return findReservaByToken(token);
};

module.exports = {
  findClasesDisponibles,
  createReserva,
  findReservaByToken,
  confirmarPorToken,
  cancelarPorToken,
};
