const pool = require('../config/db');

const findAll = async ({ archived = false } = {}) => {
  const { rows } = await pool.query(
    `SELECT * FROM entrenadores
     WHERE archivado = $1
     ORDER BY apellido ASC, nombre ASC`,
    [archived]
  );
  return rows;
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
  foto,
  estado = 'Activo',
}) => {
  const { rows } = await pool.query(
    `INSERT INTO entrenadores
       (nombre, apellido, cedula, email, telefono, especialidad, foto, estado, archivado)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)
     RETURNING *`,
    [nombre, apellido, cedula, email, telefono, especialidad, foto, estado]
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
  foto,
  estado,
}) => {
  const { rows } = await pool.query(
    `UPDATE entrenadores
     SET nombre = $1, apellido = $2, cedula = $3, email = $4, telefono = $5,
         especialidad = $6, foto = $7, estado = $8, updated_at = NOW()
     WHERE id = $9
     RETURNING *`,
    [nombre, apellido, cedula, email, telefono, especialidad, foto, estado, id]
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
