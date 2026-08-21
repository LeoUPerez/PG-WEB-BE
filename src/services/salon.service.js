const pool = require('../config/db');
const { runPagedFind } = require('../utils/pagination');

const httpError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const findAll = async ({
  archived = false,
  page = null,
  limit = null,
  search = '',
  estado = '',
} = {}) => {
  const params = [archived];
  const conditions = ['archivado = $1'];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(nombre ILIKE $${params.length} OR descripcion ILIKE $${params.length})`);
  }

  if (estado) {
    params.push(estado);
    conditions.push(`estado = $${params.length}`);
  }

  return runPagedFind({
    pool,
    selectSql: 'SELECT id, nombre, capacidad, descripcion, estado, archivado, created_at, updated_at',
    fromSql: 'FROM salones',
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
    `SELECT id, nombre, capacidad, descripcion, estado, archivado, created_at, updated_at
     FROM salones WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
};

const findClasesQueExceden = async (salonId, capacidad) => {
  const { rows } = await pool.query(
    `SELECT DISTINCT c.nombre, c.capacidad
     FROM horarios_clases h
     INNER JOIN clases c ON c.id = h.clase_id
     WHERE h.salon_id = $1
       AND h.archivado = false
       AND c.archivado = false
       AND c.capacidad > $2
     ORDER BY c.nombre ASC`,
    [salonId, capacidad]
  );
  return rows;
};

const create = async ({ nombre, capacidad, descripcion, estado = 'Activo' }) => {
  try {
    const { rows } = await pool.query(
      `INSERT INTO salones (nombre, capacidad, descripcion, estado, archivado)
       VALUES ($1, $2, $3, $4, false)
       RETURNING id, nombre, capacidad, descripcion, estado, archivado, created_at, updated_at`,
      [nombre, capacidad, descripcion || null, estado]
    );
    return rows[0];
  } catch (err) {
    if (err.code === '23505') throw httpError('Ya existe un salón con este nombre.');
    throw err;
  }
};

const update = async (id, { nombre, capacidad, descripcion, estado }) => {
  const excedidas = await findClasesQueExceden(id, capacidad);
  if (excedidas.length) {
    const detalle = excedidas
      .map((c) => `${c.nombre} (${c.capacidad} cupos)`)
      .join(', ');
    throw httpError(
      `La capacidad del salón no puede ser menor que los cupos de las clases asignadas: ${detalle}.`
    );
  }

  try {
    const { rows } = await pool.query(
      `UPDATE salones
       SET nombre = $1, capacidad = $2, descripcion = $3, estado = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, nombre, capacidad, descripcion, estado, archivado, created_at, updated_at`,
      [nombre, capacidad, descripcion || null, estado, id]
    );
    return rows[0] || null;
  } catch (err) {
    if (err.code === '23505') throw httpError('Ya existe un salón con este nombre.');
    throw err;
  }
};

const archive = async (id) => {
  const { rows: enUso } = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM horarios_clases
     WHERE salon_id = $1 AND archivado = false`,
    [id]
  );
  if (enUso[0]?.total > 0) {
    throw httpError('No se puede archivar: el salón está asignado a horarios activos.');
  }

  const { rows } = await pool.query(
    `UPDATE salones SET archivado = true, updated_at = NOW()
     WHERE id = $1
     RETURNING id, nombre, archivado`,
    [id]
  );
  return rows[0] || null;
};

const unarchive = async (id) => {
  const { rows } = await pool.query(
    `UPDATE salones SET archivado = false, updated_at = NOW()
     WHERE id = $1
     RETURNING id, nombre, archivado`,
    [id]
  );
  return rows[0] || null;
};

module.exports = { findAll, findById, create, update, archive, unarchive };
