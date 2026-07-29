const pool = require('../config/db');

// permisos is a catalogue table — read-only from the API side
const findAll = async () => {
  const { rows } = await pool.query(
    'SELECT * FROM permisos ORDER BY clave ASC'
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(
    'SELECT * FROM permisos WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

// Returns all permission keys assigned to a given role id
const findByRolId = async (rol_id) => {
  const { rows } = await pool.query(
    `SELECT p.*
     FROM permisos p
     INNER JOIN rol_permisos rp ON rp.permiso_id = p.id
     WHERE rp.rol_id = $1
     ORDER BY p.clave ASC`,
    [rol_id]
  );
  return rows;
};

module.exports = { findAll, findById, findByRolId };
