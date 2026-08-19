const pool = require('../config/db');
const { runPagedFind } = require('../utils/pagination');

const findAll = async ({
  page = null,
  limit = null,
  search = '',
  estado = '',
} = {}) => {
  const params = [];
  const conditions = ['TRUE'];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(
      nombre ILIKE $${params.length}
      OR COALESCE(rnc, '') ILIKE $${params.length}
      OR contacto ILIKE $${params.length}
      OR telefono ILIKE $${params.length}
      OR correo ILIKE $${params.length}
    )`);
  }

  if (estado) {
    params.push(estado);
    conditions.push(`estado = $${params.length}`);
  }

  return runPagedFind({
    pool,
    selectSql: 'SELECT *',
    fromSql: 'FROM proveedores',
    whereSql: conditions.join(' AND '),
    params,
    orderSql: 'nombre ASC',
    statsSql: `COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE estado = 'Activo')::int AS activos,
       COUNT(*) FILTER (WHERE estado = 'Inactivo')::int AS inactivos`,
    page,
    limit,
  });
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
