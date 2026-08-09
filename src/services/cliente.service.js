const pool = require('../config/db');

const findAll = async ({
  archived = false,
  page = null,
  limit = null,
  search = '',
  estado = '',
  sexo = '',
} = {}) => {
  const params = [archived];
  const conditions = ['archivado = $1'];

  if (search) {
    params.push(`%${search}%`);
    const position = params.length;
    conditions.push(`(
      CONCAT_WS(' ', nombre, apellido) ILIKE $${position}
      OR cedula ILIKE $${position}
      OR email ILIKE $${position}
      OR telefono ILIKE $${position}
    )`);
  }

  if (estado) {
    params.push(estado);
    conditions.push(`estado = $${params.length}`);
  }

  if (sexo) {
    params.push(sexo);
    conditions.push(`sexo = $${params.length}`);
  }

  const where = conditions.join(' AND ');
  const paginated = page !== null || limit !== null;

  if (!paginated) {
    const { rows } = await pool.query(
      `SELECT * FROM clientes
       WHERE ${where}
       ORDER BY apellido ASC, nombre ASC`,
      params
    );
    return rows;
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 15, 1), 100);
  const requestedPage = Math.max(Number(page) || 1, 1);
  const countResult = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE estado = 'Activo')::int AS activos,
       COUNT(*) FILTER (WHERE estado = 'Inactivo')::int AS inactivos
     FROM clientes
     WHERE ${where}`,
    params
  );

  const stats = countResult.rows[0];
  const totalPages = Math.max(Math.ceil(stats.total / safeLimit), 1);
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * safeLimit;
  const dataParams = [...params, safeLimit, offset];
  const limitPosition = dataParams.length - 1;
  const offsetPosition = dataParams.length;
  const { rows } = await pool.query(
    `SELECT * FROM clientes
     WHERE ${where}
     ORDER BY apellido ASC, nombre ASC
     LIMIT $${limitPosition} OFFSET $${offsetPosition}`,
    dataParams
  );

  return {
    data: rows,
    pagination: {
      page: currentPage,
      limit: safeLimit,
      total: stats.total,
      totalPages,
    },
    stats,
  };
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
