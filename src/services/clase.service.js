const pool = require('../config/db');
const { runPagedFind } = require('../utils/pagination');

const httpError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const findAll = async ({
  archived = false,
  page = null,
  limit = null,
  search = '',
  estado = '',
} = {}) => {
  const params = [archived];
  const conditions = ['archivado = $1'];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(nombre ILIKE $${params.length} OR descripcion ILIKE $${params.length})`);
  }

  if (estado) {
    params.push(estado);
    conditions.push(`estado = $${params.length}`);
  }

  return runPagedFind({
    pool,
    selectSql: 'SELECT *',
    fromSql: 'FROM clases',
    whereSql: conditions.join(' AND '),
    params,
    orderSql: 'nombre ASC',
    statsSql: `COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE estado = 'Activo')::int AS activos,
       COUNT(*) FILTER (WHERE estado = 'Inactivo')::int AS inactivos`,
    page,
    limit,
  });
};

const findById = async (id) => {
  const { rows } = await pool.query(
    'SELECT * FROM clases WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

const create = async ({ nombre, descripcion, capacidad, duracion_minutos, estado = 'Activo' }) => {
  const { rows } = await pool.query(
    `INSERT INTO clases (nombre, descripcion, capacidad, duracion_minutos, estado, archivado)
     VALUES ($1, $2, $3, $4, $5, false)
     RETURNING *`,
    [nombre, descripcion || null, capacidad, duracion_minutos, estado]
  );
  return rows[0];
};

const update = async (id, { nombre, descripcion, capacidad, duracion_minutos, estado }) => {
  if (estado === 'Activo' && !(await tieneSalonAsignado(id))) {
    throw httpError('No puedes activar la clase sin un salón asignado en el horario.');
  }

  const { rows: salonesChicos } = await pool.query(
    `SELECT DISTINCT s.nombre, s.capacidad
     FROM horarios_clases h
     INNER JOIN salones s ON s.id = h.salon_id
     WHERE h.clase_id = $1
       AND h.archivado = false
       AND s.capacidad < $2
     ORDER BY s.nombre ASC`,
    [id, capacidad]
  );
  if (salonesChicos.length) {
    const detalle = salonesChicos
      .map((s) => `${s.nombre} (${s.capacidad} plazas)`)
      .join(', ');
    throw httpError(
      `Los cupos de la clase superan la capacidad de los salones asignados: ${detalle}.`
    );
  }

  const { rows } = await pool.query(
    `UPDATE clases
     SET nombre = $1, descripcion = $2, capacidad = $3,
         duracion_minutos = $4, estado = $5, updated_at = NOW()
     WHERE id = $6
     RETURNING *`,
    [nombre, descripcion || null, capacidad, duracion_minutos, estado, id]
  );
  return rows[0] || null;
};

const tieneSalonAsignado = async (claseId) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM horarios_clases h
     INNER JOIN salones s ON s.id = h.salon_id
     WHERE h.clase_id = $1
       AND h.archivado = false
       AND h.estado = 'Activo'
       AND s.archivado = false
       AND s.estado = 'Activo'`,
    [claseId]
  );
  return (rows[0]?.total ?? 0) > 0;
};

const toggleStatus = async (id, estado) => {
  if (estado === 'Activo' && !(await tieneSalonAsignado(id))) {
    throw httpError('No puedes activar la clase sin un salón asignado en el horario.');
  }
  const { rows } = await pool.query(
    `UPDATE clases SET estado = $1, updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [estado, id]
  );
  return rows[0] || null;
};

const archive = async (id) => {
  const { rows } = await pool.query(
    `UPDATE clases SET archivado = true, updated_at = NOW()
     WHERE id = $1 RETURNING id, nombre, archivado`,
    [id]
  );
  return rows[0] || null;
};

const unarchive = async (id) => {
  const { rows } = await pool.query(
    `UPDATE clases SET archivado = false, updated_at = NOW()
     WHERE id = $1 RETURNING id, nombre, archivado`,
    [id]
  );
  return rows[0] || null;
};

module.exports = { findAll, findById, create, update, toggleStatus, archive, unarchive };
