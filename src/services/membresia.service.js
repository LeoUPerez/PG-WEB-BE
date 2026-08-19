const pool = require('../config/db');
const { runPagedFind } = require('../utils/pagination');

const SELECT_COLS = `
  id, nombre, descripcion, duracion_dias, precio,
  estado, destacado, archivado, created_at, updated_at
`;

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
    selectSql: `SELECT ${SELECT_COLS}`,
    fromSql: 'FROM membresias',
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
    `SELECT ${SELECT_COLS}
     FROM membresias WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
};

const create = async ({
  nombre,
  descripcion,
  duracion_dias,
  precio = 0,
  estado = 'Activo',
  destacado = false,
}) => {
  const { rows } = await pool.query(
    `INSERT INTO membresias
       (nombre, descripcion, duracion_dias, precio, estado, destacado, archivado)
     VALUES ($1, $2, $3, $4, $5, $6, false)
     RETURNING ${SELECT_COLS}`,
    [nombre, descripcion || null, duracion_dias, precio, estado, !!destacado]
  );
  return rows[0];
};

const update = async (id, {
  nombre,
  descripcion,
  duracion_dias,
  precio,
  estado,
  destacado = false,
}) => {
  const { rows } = await pool.query(
    `UPDATE membresias
     SET nombre = $1, descripcion = $2, duracion_dias = $3,
         precio = $4, estado = $5, destacado = $6, updated_at = NOW()
     WHERE id = $7
     RETURNING ${SELECT_COLS}`,
    [nombre, descripcion || null, duracion_dias, precio, estado, !!destacado, id]
  );
  return rows[0] || null;
};

const remove = async (id) => {
  const { rows } = await pool.query(
    `DELETE FROM membresias WHERE id = $1
     RETURNING ${SELECT_COLS}`,
    [id]
  );
  return rows[0] || null;
};

const archive = async (id) => {
  const { rows } = await pool.query(
    `UPDATE membresias SET archivado = true, updated_at = NOW()
     WHERE id = $1
     RETURNING id, nombre, archivado`,
    [id]
  );
  return rows[0] || null;
};

const unarchive = async (id) => {
  const { rows } = await pool.query(
    `UPDATE membresias SET archivado = false, updated_at = NOW()
     WHERE id = $1
     RETURNING id, nombre, archivado`,
    [id]
  );
  return rows[0] || null;
};

module.exports = { findAll, findById, create, update, remove, archive, unarchive };
