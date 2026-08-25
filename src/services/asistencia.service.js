const pool = require('../config/db');
const { runPagedFind } = require('../utils/pagination');
const clienteMembresiaService = require('./clienteMembresia.service');

const SELECT_FIELDS = `
  a.id, a.cliente_id, a.cliente_membresia_id, a.fecha, a.hora_entrada, a.hora_salida,
  a.created_by, a.created_at, a.updated_at,
  c.nombre AS cliente_nombre, c.apellido AS cliente_apellido, c.cedula AS cliente_cedula
`;
const FROM_JOIN = `FROM asistencias a JOIN clientes c ON c.id = a.cliente_id`;

const findAll = async ({ page = null, limit = null, search = '', fecha = '' } = {}) => {
  const params = [];
  const conditions = ['TRUE'];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(CONCAT_WS(' ', c.nombre, c.apellido) ILIKE $${params.length} OR c.cedula ILIKE $${params.length})`);
  }

  if (fecha) {
    params.push(fecha);
    conditions.push(`a.fecha = $${params.length}`);
  }

  return runPagedFind({
    pool,
    selectSql: `SELECT ${SELECT_FIELDS}`,
    fromSql: FROM_JOIN,
    whereSql: conditions.join(' AND '),
    params,
    orderSql: 'a.fecha DESC, a.hora_entrada DESC',
    statsSql: `COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE a.fecha = CURRENT_DATE)::int AS hoy,
       COUNT(*) FILTER (WHERE a.hora_salida IS NULL)::int AS sin_salida`,
    page,
    limit,
  });
};

const findById = async (id) => {
  const { rows } = await pool.query(`SELECT ${SELECT_FIELDS} ${FROM_JOIN} WHERE a.id = $1`, [id]);
  return rows[0] || null;
};

const buscarClientes = async (search) => {
  const term = String(search || '').trim();
  if (term.length < 2) return [];

  const { rows: clientes } = await pool.query(
    `SELECT id, nombre, apellido, cedula, foto, estado
     FROM clientes
     WHERE archivado = false
       AND (CONCAT_WS(' ', nombre, apellido) ILIKE $1 OR cedula ILIKE $1)
     ORDER BY apellido ASC, nombre ASC
     LIMIT 8`,
    [`%${term}%`]
  );

  const resultados = [];
  for (const cliente of clientes) {
    const membresia = await clienteMembresiaService.findActivaByCliente(cliente.id);
    const { rows: abiertaRows } = await pool.query(
      `SELECT id, hora_entrada FROM asistencias
       WHERE cliente_id = $1 AND fecha = CURRENT_DATE AND hora_salida IS NULL
       ORDER BY hora_entrada DESC LIMIT 1`,
      [cliente.id]
    );
    resultados.push({
      ...cliente,
      membresia_activa: !!membresia,
      membresia_nombre: membresia ? membresia.membresia_nombre : null,
      membresia_vencimiento: membresia ? membresia.fecha_vencimiento : null,
      asistencia_abierta: abiertaRows[0] || null,
    });
  }
  return resultados;
};

const registrarEntrada = async ({ cliente_id, created_by }) => {
  const { rows: clienteRows } = await pool.query('SELECT * FROM clientes WHERE id = $1', [cliente_id]);
  const cliente = clienteRows[0];
  if (!cliente) { const err = new Error('Cliente no encontrado'); err.status = 404; throw err; }
  if (cliente.estado !== 'Activo' || cliente.archivado) {
    const err = new Error('El cliente no está activo'); err.status = 400; throw err;
  }

  const { rows: abiertaRows } = await pool.query(
    `SELECT id FROM asistencias WHERE cliente_id = $1 AND fecha = CURRENT_DATE AND hora_salida IS NULL`,
    [cliente_id]
  );
  if (abiertaRows[0]) {
    const err = new Error('Este cliente ya tiene una entrada abierta hoy.'); err.status = 409; throw err;
  }

  const membresia = await clienteMembresiaService.findActivaByCliente(cliente_id);
  if (!membresia) {
    const err = new Error('Acceso denegado: membresía vencida o inexistente.'); err.status = 403; throw err;
  }

  const { rows } = await pool.query(
    `INSERT INTO asistencias (cliente_id, cliente_membresia_id, created_by)
     VALUES ($1, $2, $3) RETURNING id`,
    [cliente_id, membresia ? membresia.id : null, created_by || null]
  );
  return findById(rows[0].id);
};

const registrarSalida = async (id) => {
  const { rows } = await pool.query(
    `UPDATE asistencias SET hora_salida = CURRENT_TIME, updated_at = NOW()
     WHERE id = $1 AND hora_salida IS NULL
     RETURNING id`,
    [id]
  );
  if (!rows[0]) return null;
  return findById(rows[0].id);
};

module.exports = { findAll, findById, buscarClientes, registrarEntrada, registrarSalida };
