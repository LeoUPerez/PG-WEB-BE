const pool = require('../config/db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const findAll = async () => {
  const { rows } = await pool.query(
    `SELECT id, usuario, nombre, rol, estado, archivado, created_at, updated_at
     FROM usuarios
     WHERE archivado = false
     ORDER BY nombre ASC`
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(
    `SELECT id, usuario, nombre, rol, estado, archivado, created_at, updated_at
     FROM usuarios
     WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
};

const findByUsuario = async (usuario) => {
  // Includes password hash — only for auth use
  const { rows } = await pool.query(
    'SELECT * FROM usuarios WHERE usuario = $1',
    [usuario]
  );
  return rows[0] || null;
};

const create = async ({ usuario, nombre, password, rol, estado = true }) => {
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const { rows } = await pool.query(
    `INSERT INTO usuarios (usuario, nombre, password, rol, estado, archivado)
     VALUES ($1, $2, $3, $4, $5, false)
     RETURNING id, usuario, nombre, rol, estado, archivado, created_at, updated_at`,
    [usuario, nombre, hash, rol, estado]
  );
  return rows[0];
};

const update = async (id, { usuario, nombre, rol, estado }) => {
  const { rows } = await pool.query(
    `UPDATE usuarios
     SET usuario = $1, nombre = $2, rol = $3, estado = $4, updated_at = NOW()
     WHERE id = $5
     RETURNING id, usuario, nombre, rol, estado, archivado, created_at, updated_at`,
    [usuario, nombre, rol, estado, id]
  );
  return rows[0] || null;
};

const cambiarPassword = async (id, nuevaPassword) => {
  const hash = await bcrypt.hash(nuevaPassword, SALT_ROUNDS);
  await pool.query(
    'UPDATE usuarios SET password = $1, updated_at = NOW() WHERE id = $2',
    [hash, id]
  );
};

const cambiarEstado = async (id, estado) => {
  const { rows } = await pool.query(
    `UPDATE usuarios SET estado = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, usuario, nombre, rol, estado, archivado`,
    [estado, id]
  );
  return rows[0] || null;
};

const archivar = async (id) => {
  const { rows } = await pool.query(
    `UPDATE usuarios SET archivado = true, updated_at = NOW()
     WHERE id = $1
     RETURNING id, usuario, archivado`,
    [id]
  );
  return rows[0] || null;
};

module.exports = {
  findAll,
  findById,
  findByUsuario,
  create,
  update,
  cambiarPassword,
  cambiarEstado,
  archivar,
};
