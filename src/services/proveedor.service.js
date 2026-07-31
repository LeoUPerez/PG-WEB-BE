const pool = require('../config/db');

const findAll = async () => {
  const { rows } = await pool.query(
    `SELECT * FROM proveedores
     ORDER BY nombre ASC`
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(
    'SELECT * FROM proveedores WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

const create = async ({
  nombre,
  rnc,
  contacto,
  telefono,
  correo,
  direccion,
  estado = 'Activo',
}) => {
  const { rows } = await pool.query(
    `INSERT INTO proveedores
       (nombre, rnc, contacto, telefono, correo, direccion, estado)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [nombre, rnc || null, contacto, telefono, correo, direccion, estado]
  );
  return rows[0];
};

const update = async (id, {
  nombre,
  rnc,
  contacto,
  telefono,
  correo,
  direccion,
  estado,
}) => {
  const { rows } = await pool.query(
    `UPDATE proveedores
     SET nombre = $1, rnc = $2, contacto = $3, telefono = $4,
         correo = $5, direccion = $6, estado = $7, updated_at = NOW()
     WHERE id = $8
     RETURNING *`,
    [nombre, rnc || null, contacto, telefono, correo, direccion, estado, id]
  );
  return rows[0] || null;
};

module.exports = { findAll, findById, create, update };
