const pool = require('../config/db');

const httpError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const SELECT_COLS = `
  h.id, h.clase_id, h.entrenador_id, h.salon_id, h.dia,
  TO_CHAR(h.hora_inicio, 'HH24:MI') AS hora_inicio,
  TO_CHAR(h.hora_fin, 'HH24:MI') AS hora_fin,
  h.estado, h.archivado, h.created_at, h.updated_at,
  c.nombre AS clase_nombre,
  c.capacidad AS clase_capacidad,
  TRIM(CONCAT(e.nombre, ' ', e.apellido)) AS entrenador_nombre,
  s.nombre AS salon_nombre,
  s.capacidad AS salon_capacidad,
  LEAST(c.capacidad, COALESCE(s.capacidad, c.capacidad)) AS cupos
`;

const FROM_JOIN = `
  FROM horarios_clases h
  INNER JOIN clases c ON c.id = h.clase_id
  INNER JOIN entrenadores e ON e.id = h.entrenador_id
  LEFT JOIN salones s ON s.id = h.salon_id
`;

const DIA_ORDER = `
  CASE h.dia
    WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miércoles' THEN 3
    WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 WHEN 'Sábado' THEN 6
    WHEN 'Domingo' THEN 7 ELSE 8
  END
`;

const assertSalonDisponible = async ({
  salon_id,
  clase_id,
  dia,
  hora_inicio,
  hora_fin,
  excludeId = null,
  db = pool,
}) => {
  if (!salon_id) {
    throw httpError('Selecciona un salón.');
  }

  const { rows: salonRows } = await db.query(
    `SELECT id, nombre, capacidad, estado, archivado FROM salones WHERE id = $1`,
    [salon_id]
  );
  const salon = salonRows[0];
  if (!salon || salon.archivado || salon.estado !== 'Activo') {
    throw httpError('El salón seleccionado no es válido.');
  }

  const { rows: claseRows } = await db.query(
    `SELECT id, nombre, capacidad FROM clases WHERE id = $1`,
    [clase_id]
  );
  const clase = claseRows[0];
  if (!clase) {
    throw httpError('La clase no es válida.');
  }
  if (clase.capacidad > salon.capacidad) {
    throw httpError(
      `La clase ${clase.nombre} tiene ${clase.capacidad} cupos y el salón ${salon.nombre} solo admite ${salon.capacidad}.`
    );
  }

  const params = [salon_id, dia, hora_inicio, hora_fin];
  let excludeSql = '';
  if (excludeId) {
    params.push(excludeId);
    excludeSql = `AND h.id <> $${params.length}`;
  }

  const { rows: choque } = await db.query(
    `SELECT h.id, c.nombre AS clase_nombre,
            TO_CHAR(h.hora_inicio, 'HH24:MI') AS hora_inicio,
            TO_CHAR(h.hora_fin, 'HH24:MI') AS hora_fin
     FROM horarios_clases h
     INNER JOIN clases c ON c.id = h.clase_id
     WHERE h.salon_id = $1
       AND h.dia = $2
       AND h.archivado = false
       AND h.estado = 'Activo'
       AND h.hora_inicio < $4::time
       AND h.hora_fin > $3::time
       ${excludeSql}
     LIMIT 1`,
    params
  );

  if (choque[0]) {
    throw httpError(
      `El salón ${salon.nombre} ya está ocupado el ${dia} de ${choque[0].hora_inicio} a ${choque[0].hora_fin} (${choque[0].clase_nombre}).`
    );
  }
};

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
  salon_id,
  dia,
  hora_inicio,
  hora_fin,
  estado = 'Activo',
}) => {
  await assertSalonDisponible({ salon_id, clase_id, dia, hora_inicio, hora_fin });
  const { rows } = await pool.query(
    `INSERT INTO horarios_clases
       (clase_id, entrenador_id, salon_id, dia, hora_inicio, hora_fin, estado, archivado)
     VALUES ($1, $2, $3, $4, $5, $6, $7, false)
     RETURNING id`,
    [clase_id, entrenador_id, salon_id, dia, hora_inicio, hora_fin, estado]
  );
  return findById(rows[0].id);
};

const createBulk = async ({ clase_id, entrenador_id, salon_id, estado = 'Activo', dias }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const ids = [];
    for (const d of dias) {
      await assertSalonDisponible({
        salon_id,
        clase_id,
        dia: d.dia,
        hora_inicio: d.hora_inicio,
        hora_fin: d.hora_fin,
        db: client,
      });
      const { rows } = await client.query(
        `INSERT INTO horarios_clases
           (clase_id, entrenador_id, salon_id, dia, hora_inicio, hora_fin, estado, archivado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, false)
         RETURNING id`,
        [clase_id, entrenador_id, salon_id, d.dia, d.hora_inicio, d.hora_fin, estado]
      );
      ids.push(rows[0].id);
    }
    await client.query('COMMIT');
    const creados = [];
    for (const id of ids) creados.push(await findById(id));
    return creados;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const update = async (id, {
  clase_id,
  entrenador_id,
  salon_id,
  dia,
  hora_inicio,
  hora_fin,
  estado,
}) => {
  await assertSalonDisponible({
    salon_id,
    clase_id,
    dia,
    hora_inicio,
    hora_fin,
    excludeId: id,
  });
  const { rows } = await pool.query(
    `UPDATE horarios_clases
     SET clase_id = $1, entrenador_id = $2, salon_id = $3, dia = $4,
         hora_inicio = $5, hora_fin = $6, estado = $7, updated_at = NOW()
     WHERE id = $8
     RETURNING id`,
    [clase_id, entrenador_id, salon_id, dia, hora_inicio, hora_fin, estado, id]
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
  createBulk,
  update,
  toggleStatus,
  archive,
  unarchive,
};
