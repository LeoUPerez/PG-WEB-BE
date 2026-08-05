const pool = require('../config/db');

const SELECT_COLS = `
  h.id, h.clase_id, h.entrenador_id, h.dia,
  TO_CHAR(h.hora_inicio, 'HH24:MI') AS hora_inicio,
  TO_CHAR(h.hora_fin, 'HH24:MI') AS hora_fin,
  h.estado, h.archivado, h.created_at, h.updated_at,
  c.nombre AS clase_nombre,
  TRIM(CONCAT(e.nombre, ' ', e.apellido)) AS entrenador_nombre
`;

const FROM_JOIN = `
  FROM horarios_clases h
  INNER JOIN clases c ON c.id = h.clase_id
  INNER JOIN entrenadores e ON e.id = h.entrenador_id
`;

const DIA_ORDER = `
  CASE h.dia
    WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miércoles' THEN 3
    WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 WHEN 'Sábado' THEN 6
    WHEN 'Domingo' THEN 7 ELSE 8
  END
`;

const findAll = async ({ archived = false } = {}) => {
  const { rows } = await pool.query(
    `SELECT ${SELECT_COLS}
     ${FROM_JOIN}
     WHERE h.archivado = $1
     ORDER BY ${DIA_ORDER}, h.hora_inicio ASC`,
    [archived]
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(
    `SELECT ${SELECT_COLS}
     ${FROM_JOIN}
     WHERE h.id = $1`,
    [id]
  );
  return rows[0] || null;
};

const create = async ({
  clase_id,
  entrenador_id,
  dia,
  hora_inicio,
  hora_fin,
  estado = 'Activo',
}) => {
  const { rows } = await pool.query(
    `INSERT INTO horarios_clases
       (clase_id, entrenador_id, dia, hora_inicio, hora_fin, estado, archivado)
     VALUES ($1, $2, $3, $4, $5, $6, false)
     RETURNING id`,
    [clase_id, entrenador_id, dia, hora_inicio, hora_fin, estado]
  );
  return findById(rows[0].id);
};

const update = async (id, {
  clase_id,
  entrenador_id,
  dia,
  hora_inicio,
  hora_fin,
  estado,
}) => {
  const { rows } = await pool.query(
    `UPDATE horarios_clases
     SET clase_id = $1, entrenador_id = $2, dia = $3,
         hora_inicio = $4, hora_fin = $5, estado = $6, updated_at = NOW()
     WHERE id = $7
     RETURNING id`,
    [clase_id, entrenador_id, dia, hora_inicio, hora_fin, estado, id]
  );
  if (!rows[0]) return null;
  return findById(rows[0].id);
};

const toggleStatus = async (id, estado) => {
  const { rows } = await pool.query(
    `UPDATE horarios_clases SET estado = $1, updated_at = NOW()
     WHERE id = $2 RETURNING id`,
    [estado, id]
  );
  if (!rows[0]) return null;
  return findById(rows[0].id);
};

const archive = async (id) => {
  const { rows } = await pool.query(
    `UPDATE horarios_clases SET archivado = true, updated_at = NOW()
     WHERE id = $1 RETURNING id, archivado`,
    [id]
  );
  return rows[0] || null;
};

const unarchive = async (id) => {
  const { rows } = await pool.query(
    `UPDATE horarios_clases SET archivado = false, updated_at = NOW()
     WHERE id = $1 RETURNING id, archivado`,
    [id]
  );
  return rows[0] || null;
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  toggleStatus,
  archive,
  unarchive,
};
