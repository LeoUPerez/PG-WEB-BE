const pool = require('../config/db');

const findAll = async ({ estado = '' } = {}) => {
  const params = [];
  const conditions = ['TRUE'];

  if (estado) {
    params.push(estado);
    conditions.push(`estado = $${params.length}`);
  }

  const { rows } = await pool.query(
    `SELECT id, nombre, estado, created_at, updated_at
     FROM metodos_pago
     WHERE ${conditions.join(' AND ')}
     ORDER BY nombre ASC`,
    params
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(
    `SELECT id, nombre, estado, created_at, updated_at FROM metodos_pago WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
};

const create = async ({ nombre, estado = 'Activo' }) => {
  const { rows } = await pool.query(
    `INSERT INTO metodos_pago (nombre, estado)
     VALUES ($1, $2)
     RETURNING id, nombre, estado, created_at, updated_at`,
    [nombre, estado]
  );
  return rows[0];
};

const update = async (id, { nombre, estado }) => {
  const { rows } = await pool.query(
    `UPDATE metodos_pago
     SET nombre = $1, estado = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING id, nombre, estado, created_at, updated_at`,
    [nombre, estado, id]
  );
  return rows[0] || null;
};

const toggleStatus = async (id, estado) => {
  const { rows } = await pool.query(
    `UPDATE metodos_pago SET estado = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, nombre, estado, created_at, updated_at`,
    [estado, id]
  );
  return rows[0] || null;
};

module.exports = { findAll, findById, create, update, toggleStatus };
