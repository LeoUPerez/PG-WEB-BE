const pool = require('../config/db');

const SELECT_COLS = `
  id, nombre, descripcion, duracion_dias, precio,
  estado, archivado, created_at, updated_at
`;

const findAll = async ({ archived = false } = {}) => {
  const { rows } = await pool.query(
    `SELECT ${SELECT_COLS}
     FROM membresias
     WHERE archivado = $1
     ORDER BY nombre ASC`,
    [archived]
  );
  return rows;
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
}) => {
  const { rows } = await pool.query(
    `INSERT INTO membresias
       (nombre, descripcion, duracion_dias, precio, estado, archivado)
     VALUES ($1, $2, $3, $4, $5, false)
     RETURNING ${SELECT_COLS}`,
    [nombre, descripcion || null, duracion_dias, precio, estado]
  );
  return rows[0];
};

const update = async (id, {
  nombre,
  descripcion,
  duracion_dias,
  precio,
  estado,
}) => {
  const { rows } = await pool.query(
    `UPDATE membresias
     SET nombre = $1, descripcion = $2, duracion_dias = $3,
         precio = $4, estado = $5, updated_at = NOW()
     WHERE id = $6
     RETURNING ${SELECT_COLS}`,
    [nombre, descripcion || null, duracion_dias, precio, estado, id]
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
