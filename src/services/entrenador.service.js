const pool = require('../config/db');
const { runPagedFind } = require('../utils/pagination');

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
    conditions.push(`(
      CONCAT_WS(' ', nombre, apellido) ILIKE $${params.length}
      OR cedula ILIKE $${params.length}
      OR email ILIKE $${params.length}
      OR telefono ILIKE $${params.length}
      OR especialidad ILIKE $${params.length}
    )`);
  }

  if (estado) {
    params.push(estado);
    conditions.push(`estado = $${params.length}`);
  }

  return runPagedFind({
    pool,
    selectSql: 'SELECT *',
    fromSql: 'FROM entrenadores',
    whereSql: conditions.join(' AND '),
    params,
    orderSql: 'apellido ASC, nombre ASC',
    statsSql: `COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE estado = 'Activo')::int AS activos,
       COUNT(*) FILTER (WHERE estado = 'Inactivo')::int AS inactivos`,
    page,
    limit,
  });
};

const findById = async (id) => {
  const { rows } = await pool.query(
    'SELECT * FROM entrenadores WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

const create = async ({
  nombre,
  apellido,
  cedula,
  email,
  telefono,
  especialidad,
  horario,
  fecha_contratacion,
  foto,
  estado = 'Activo',
}) => {
  const { rows } = await pool.query(
    `INSERT INTO entrenadores
       (nombre, apellido, cedula, email, telefono, especialidad, horario, fecha_contratacion, foto, estado, archivado)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false)
     RETURNING *`,
    [nombre, apellido, cedula, email, telefono, especialidad, horario || null, fecha_contratacion || null, foto, estado]
  );
  return rows[0];
};

const update = async (id, {
  nombre,
  apellido,
  cedula,
  email,
  telefono,
  especialidad,
  horario,
  fecha_contratacion,
  foto,
  estado,
}) => {
  const { rows } = await pool.query(
    `UPDATE entrenadores
     SET nombre = $1, apellido = $2, cedula = $3, email = $4, telefono = $5,
         especialidad = $6, horario = $7, fecha_contratacion = $8, foto = $9, estado = $10,
         updated_at = NOW()
     WHERE id = $11
     RETURNING *`,
    [nombre, apellido, cedula, email, telefono, especialidad, horario || null, fecha_contratacion || null, foto, estado, id]
  );
  return rows[0] || null;
};

const archive = async (id) => {
  const { rows } = await pool.query(
    `UPDATE entrenadores SET archivado = true, updated_at = NOW()
     WHERE id = $1
     RETURNING id, nombre, apellido, archivado`,
    [id]
  );
  return rows[0] || null;
};

const unarchive = async (id) => {
  const { rows } = await pool.query(
    `UPDATE entrenadores SET archivado = false, updated_at = NOW()
     WHERE id = $1
     RETURNING id, nombre, apellido, archivado`,
    [id]
  );
  return rows[0] || null;
};

module.exports = { findAll, findById, create, update, archive, unarchive };
