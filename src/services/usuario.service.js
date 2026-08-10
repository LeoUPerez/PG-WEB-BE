const pool = require('../config/db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const findAll = async ({ archived = false } = {}) => {
  const { rows } = await pool.query(
    `SELECT id, usuario, nombre, email, rol, estado, archivado, created_at, updated_at
     FROM usuarios
     WHERE archivado = $1
     ORDER BY nombre ASC`,
    [archived]
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(
    `SELECT id, usuario, nombre, email, rol, estado, archivado, created_at, updated_at
     FROM usuarios
     WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
};

const findByUsername = async (username) => {
  // Includes password hash — only for auth use
  const { rows } = await pool.query(
    'SELECT * FROM usuarios WHERE usuario = $1',
    [username]
  );
  return rows[0] || null;
};

const create = async ({ usuario, nombre, email, password, rol, estado = true }) => {
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const { rows } = await pool.query(
    `INSERT INTO usuarios (usuario, nombre, email, password, rol, estado, archivado)
     VALUES ($1, $2, $3, $4, $5, $6, false)
     RETURNING id, usuario, nombre, email, rol, estado, archivado, created_at, updated_at`,
    [usuario, nombre, email || null, hash, rol, estado]
  );
  return rows[0];
};

const update = async (id, { usuario, nombre, email, rol, estado }) => {
  const { rows } = await pool.query(
    `UPDATE usuarios
     SET usuario = $1, nombre = $2, email = $3, rol = $4, estado = $5, updated_at = NOW()
     WHERE id = $6
     RETURNING id, usuario, nombre, email, rol, estado, archivado, created_at, updated_at`,
    [usuario, nombre, email || null, rol, estado, id]
  );
  return rows[0] || null;
};

const changePassword = async (id, newPassword) => {
  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.query(
    'UPDATE usuarios SET password = $1, updated_at = NOW() WHERE id = $2',
    [hash, id]
  );
};

const toggleStatus = async (id, estado) => {
  const { rows } = await pool.query(
    `UPDATE usuarios SET estado = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, usuario, nombre, rol, estado, archivado`,
    [estado, id]
  );
  return rows[0] || null;
};

const archive = async (id) => {
  const { rows } = await pool.query(
    `UPDATE usuarios SET archivado = true, updated_at = NOW()
     WHERE id = $1
     RETURNING id, usuario, archivado`,
    [id]
  );
  return rows[0] || null;
};

const unarchive = async (id) => {
  const { rows } = await pool.query(
    `UPDATE usuarios SET archivado = false, updated_at = NOW()
     WHERE id = $1
     RETURNING id, usuario, archivado`,
    [id]
  );
  return rows[0] || null;
};

module.exports = {
  findAll,
  findById,
  findByUsername,
  create,
  update,
  changePassword,
  toggleStatus,
  archive,
  unarchive,
};
