const pool = require('../config/db');

const findAll = async () => {
  const { rows } = await pool.query(
    'SELECT * FROM roles ORDER BY nombre ASC'
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(
    'SELECT * FROM roles WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

const findByName = async (name) => {
  const { rows } = await pool.query(
    'SELECT * FROM roles WHERE nombre = $1',
    [name]
  );
  return rows[0] || null;
};

const findPermissions = async (roleId) => {
  const { rows } = await pool.query(
    `SELECT p.*
     FROM permisos p
     INNER JOIN rol_permisos rp ON rp.permiso_id = p.id
     WHERE rp.rol_id = $1
     ORDER BY p.clave ASC`,
    [roleId]
  );
  return rows;
};

const create = async ({ nombre, descripcion, estado = true }) => {
  const { rows } = await pool.query(
    `INSERT INTO roles (nombre, descripcion, estado)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [nombre, descripcion, estado]
  );
  return rows[0];
};

const update = async (id, { nombre, descripcion, estado }) => {
  const { rows } = await pool.query(
    `UPDATE roles
     SET nombre = $1, descripcion = $2, estado = $3
     WHERE id = $4
     RETURNING *`,
    [nombre, descripcion, estado, id]
  );
  return rows[0] || null;
};

const toggleStatus = async (id, estado) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'UPDATE roles SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, id]
    );

    // Deactivating a role removes all its assigned permissions
    if (!estado) {
      await client.query(
        'DELETE FROM rol_permisos WHERE rol_id = $1',
        [id]
      );
    }

    await client.query('COMMIT');
    return rows[0] || null;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const assignPermissions = async (roleId, permissionIds = []) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Replace all permissions for the role
    await client.query(
      'DELETE FROM rol_permisos WHERE rol_id = $1',
      [roleId]
    );

    for (const permissionId of permissionIds) {
      await client.query(
        'INSERT INTO rol_permisos (rol_id, permiso_id) VALUES ($1, $2)',
        [roleId, permissionId]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { findAll, findById, findByName, findPermissions, create, update, toggleStatus, assignPermissions };
