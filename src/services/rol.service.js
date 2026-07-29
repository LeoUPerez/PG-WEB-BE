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

const cambiarEstado = async (id, estado) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'UPDATE roles SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, id]
    );

    // Si se desactiva el rol, se eliminan sus permisos asignados
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

const asignarPermisos = async (rol_id, permiso_ids = []) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Reemplazar todos los permisos del rol
    await client.query(
      'DELETE FROM rol_permisos WHERE rol_id = $1',
      [rol_id]
    );

    for (const permiso_id of permiso_ids) {
      await client.query(
        'INSERT INTO rol_permisos (rol_id, permiso_id) VALUES ($1, $2)',
        [rol_id, permiso_id]
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

module.exports = { findAll, findById, create, update, cambiarEstado, asignarPermisos };
