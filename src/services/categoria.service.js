const pool = require('../config/db');

const findAll = async ({ archived = false } = {}) => {
  const { rows } = await pool.query(
    `SELECT id, nombre, descripcion,
            TO_CHAR(fecha_registro, 'YYYY-MM-DD') AS fecha_registro,
            estado, archivado, created_at, updated_at
     FROM categorias
     WHERE archivado = $1
     ORDER BY nombre ASC`,
    [archived]
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(
    `SELECT id, nombre, descripcion,
            TO_CHAR(fecha_registro, 'YYYY-MM-DD') AS fecha_registro,
            estado, archivado, created_at, updated_at
     FROM categorias WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
};

const create = async ({
  nombre,
  descripcion,
  fecha_registro,
  estado = 'Activo',
}) => {
  const { rows } = await pool.query(
    `INSERT INTO categorias
       (nombre, descripcion, fecha_registro, estado, archivado)
     VALUES ($1, $2, $3, $4, false)
     RETURNING id, nombre, descripcion,
               TO_CHAR(fecha_registro, 'YYYY-MM-DD') AS fecha_registro,
               estado, archivado, created_at, updated_at`,
    [nombre, descripcion || null, fecha_registro || null, estado]
  );
  return rows[0];
};

const update = async (id, {
  nombre,
  descripcion,
  fecha_registro,
  estado,
}) => {
  const { rows } = await pool.query(
    `UPDATE categorias
     SET nombre = $1, descripcion = $2, fecha_registro = $3, estado = $4,
         updated_at = NOW()
     WHERE id = $5
     RETURNING id, nombre, descripcion,
               TO_CHAR(fecha_registro, 'YYYY-MM-DD') AS fecha_registro,
               estado, archivado, created_at, updated_at`,
    [nombre, descripcion || null, fecha_registro || null, estado, id]
  );
  return rows[0] || null;
};

const archive = async (id) => {
  const { rows } = await pool.query(
    `UPDATE categorias SET archivado = true, updated_at = NOW()
     WHERE id = $1
     RETURNING id, nombre, archivado`,
    [id]
  );
  return rows[0] || null;
};

const unarchive = async (id) => {
  const { rows } = await pool.query(
    `UPDATE categorias SET archivado = false, updated_at = NOW()
     WHERE id = $1
     RETURNING id, nombre, archivado`,
    [id]
  );
  return rows[0] || null;
};

module.exports = { findAll, findById, create, update, archive, unarchive };
