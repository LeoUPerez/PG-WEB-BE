const pool = require('../config/db');

const findAll = async ({ archived = false } = {}) => {
  const { rows } = await pool.query(
    `SELECT * FROM clientes
     WHERE archivado = $1
     ORDER BY apellido ASC, nombre ASC`,
    [archived]
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(
    'SELECT * FROM clientes WHERE id = $1',
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
  direccion,
  fecha_nacimiento,
  sexo,
  foto,
  estado = 'Activo',
}) => {
  const { rows } = await pool.query(
    `INSERT INTO clientes
       (nombre, apellido, cedula, email, telefono, direccion, fecha_nacimiento, sexo, foto, estado, archivado)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false)
     RETURNING *`,
    [nombre, apellido, cedula, email, telefono, direccion, fecha_nacimiento, sexo, foto, estado]
  );
  return rows[0];
};

const update = async (id, {
  nombre,
  apellido,
  cedula,
  email,
  telefono,
  direccion,
  fecha_nacimiento,
  sexo,
  foto,
  estado,
}) => {
  const { rows } = await pool.query(
    `UPDATE clientes
     SET nombre = $1, apellido = $2, cedula = $3, email = $4, telefono = $5,
         direccion = $6, fecha_nacimiento = $7, sexo = $8, foto = $9, estado = $10,
         updated_at = NOW()
     WHERE id = $11
     RETURNING *`,
    [nombre, apellido, cedula, email, telefono, direccion, fecha_nacimiento, sexo, foto, estado, id]
  );
  return rows[0] || null;
};

const archive = async (id) => {
  const { rows } = await pool.query(
    `UPDATE clientes SET archivado = true, updated_at = NOW()
     WHERE id = $1
     RETURNING id, nombre, apellido, archivado`,
    [id]
  );
  return rows[0] || null;
};

const unarchive = async (id) => {
  const { rows } = await pool.query(
    `UPDATE clientes SET archivado = false, updated_at = NOW()
     WHERE id = $1
     RETURNING id, nombre, apellido, archivado`,
    [id]
  );
  return rows[0] || null;
};

module.exports = { findAll, findById, create, update, archive, unarchive };
