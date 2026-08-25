const pool = require('../config/db');
const { runPagedFind } = require('../utils/pagination');

const SELECT_JOIN = `
  SELECT r.id, r.horario_id, r.fecha_clase, r.nombre, r.apellido, r.cedula,
         r.email, r.telefono, r.notas, r.estado, r.cliente_id,
         r.created_at, r.updated_at,
         h.dia, h.clase_id,
         TO_CHAR(h.hora_inicio, 'HH24:MI') AS hora_inicio,
         TO_CHAR(h.hora_fin, 'HH24:MI') AS hora_fin,
         c.nombre AS clase_nombre,
         c.descripcion AS clase_descripcion,
         c.capacidad AS clase_capacidad,
         c.duracion_minutos AS clase_duracion_minutos,
         TRIM(CONCAT(e.nombre, ' ', e.apellido)) AS entrenador_nombre,
         s.nombre AS salon_nombre
  FROM reservas_clases r
  JOIN horarios_clases h ON h.id = r.horario_id
  JOIN clases c ON c.id = h.clase_id
  JOIN entrenadores e ON e.id = h.entrenador_id
  LEFT JOIN salones s ON s.id = h.salon_id
`;

const findAll = async ({
  page = null,
  limit = null,
  search = '',
  estado = '',
} = {}) => {
  const params = [];
  const conditions = ['TRUE'];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(
      CONCAT_WS(' ', r.nombre, r.apellido) ILIKE $${params.length}
      OR r.cedula ILIKE $${params.length}
      OR r.email ILIKE $${params.length}
      OR c.nombre ILIKE $${params.length}
      OR TRIM(CONCAT(e.nombre, ' ', e.apellido)) ILIKE $${params.length}
    )`);
  }

  if (estado) {
    params.push(estado);
    conditions.push(`r.estado = $${params.length}`);
  }

  return runPagedFind({
    pool,
    selectSql: `SELECT r.id, r.horario_id, r.fecha_clase, r.nombre, r.apellido, r.cedula,
         r.email, r.telefono, r.notas, r.estado, r.cliente_id,
         r.created_at, r.updated_at,
         h.dia, h.clase_id,
         TO_CHAR(h.hora_inicio, 'HH24:MI') AS hora_inicio,
         TO_CHAR(h.hora_fin, 'HH24:MI') AS hora_fin,
         c.nombre AS clase_nombre,
         c.descripcion AS clase_descripcion,
         c.capacidad AS clase_capacidad,
         c.duracion_minutos AS clase_duracion_minutos,
         TRIM(CONCAT(e.nombre, ' ', e.apellido)) AS entrenador_nombre,
         s.nombre AS salon_nombre`,
    fromSql: `FROM reservas_clases r
  JOIN horarios_clases h ON h.id = r.horario_id
  JOIN clases c ON c.id = h.clase_id
  JOIN entrenadores e ON e.id = h.entrenador_id
  LEFT JOIN salones s ON s.id = h.salon_id`,
    whereSql: conditions.join(' AND '),
    params,
    orderSql: 'r.fecha_clase ASC, h.hora_inicio ASC, r.created_at ASC',
    statsSql: `COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE r.estado = 'Pendiente')::int AS pendientes,
       COUNT(*) FILTER (WHERE r.estado = 'Confirmada')::int AS confirmadas,
       COUNT(*) FILTER (WHERE r.estado = 'Cancelada')::int AS canceladas`,
    page,
    limit,
  });
};

const findById = async (id) => {
  const { rows } = await pool.query(`${SELECT_JOIN} WHERE r.id = $1`, [id]);
  return rows[0] || null;
};

const confirmar = async (id) => {
  const { rows: reservaRows } = await pool.query('SELECT * FROM reservas_clases WHERE id = $1', [id]);
  const reserva = reservaRows[0];
  if (!reserva) return null;
  if (reserva.estado !== 'Pendiente') {
    const err = new Error('Solo se pueden confirmar reservas pendientes');
    err.status = 400;
    throw err;
  }

  await pool.query(
    "UPDATE reservas_clases SET estado = 'Confirmada', updated_at = NOW() WHERE id = $1",
    [id]
  );
  return findById(id);
};

const cancelar = async (id) => {
  const { rows: reservaRows } = await pool.query('SELECT * FROM reservas_clases WHERE id = $1', [id]);
  const reserva = reservaRows[0];
  if (!reserva) return null;
  if (reserva.estado === 'Cancelada') {
    const err = new Error('La reserva ya está cancelada');
    err.status = 400;
    throw err;
  }

  await pool.query(
    "UPDATE reservas_clases SET estado = 'Cancelada', updated_at = NOW() WHERE id = $1",
    [id]
  );
  return findById(id);
};

module.exports = { findAll, findById, confirmar, cancelar };
