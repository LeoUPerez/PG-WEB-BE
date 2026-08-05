const pool = require('../config/db');

const findAll = async ({ archived = false } = {}) => {
  const { rows } = await pool.query(
    `SELECT * FROM clases
     WHERE archivado = $1
     ORDER BY nombre ASC`,
    [archived]
  );
  return rows;
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

const toggleStatus = async (id, estado) => {
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
