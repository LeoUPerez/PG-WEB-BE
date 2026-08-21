const pool = require('../config/db');

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
       c.id AS clase_id,
       c.nombre,
       c.capacidad,
       LEAST(c.capacidad, COALESCE(s.capacidad, c.capacidad)) AS cupos
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

const fechaCoincideConDia = (fechaClase, dia) => {
  const date = new Date(`${fechaClase}T12:00:00`);
  return DIAS_SEMANA[date.getDay()] === dia;
};

const findClienteIdByCedula = async (cedula) => {
  const { rows } = await pool.query(
    `SELECT id FROM clientes WHERE cedula = $1 AND archivado = false LIMIT 1`,
    [cedula]
  );
  return rows[0]?.id ?? null;
};

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

  const reservasActivas = await countReservasActivas(horario_id, fecha_clase);
  if (reservasActivas >= horario.cupos) {
    const error = new Error('No hay cupos disponibles para esta clase.');
    error.statusCode = 409;
    throw error;
  }

  const clienteId = await findClienteIdByCedula(cedula.trim());

  const { rows } = await pool.query(
    `INSERT INTO reservas_clases
       (horario_id, fecha_clase, nombre, apellido, cedula, email, telefono, notas, cliente_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, horario_id, fecha_clase, nombre, apellido, cedula, email, telefono, notas, estado, created_at`,
    [
      horario_id,
      fecha_clase,
      nombre.trim(),
      apellido.trim(),
      cedula.trim(),
      email.trim(),
      telefono.trim(),
      notas?.trim() || null,
      clienteId,
    ]
  );

  return {
    ...rows[0],
    clase_nombre: horario.nombre,
    dia: horario.dia,
  };
};

module.exports = {
  findClasesDisponibles,
  createReserva,
};
