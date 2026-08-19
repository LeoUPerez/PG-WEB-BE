const pool = require('../config/db');
const { runPagedFind } = require('../utils/pagination');

const SELECT_JOIN = `
  SELECT ca.id, ca.numero_cargo, ca.cliente_id, ca.cliente_membresia_id, ca.concepto,
         ca.monto, ca.fecha_generacion, ca.fecha_vencimiento, ca.estado,
         ca.created_at, ca.updated_at,
         c.nombre AS cliente_nombre, c.apellido AS cliente_apellido, c.cedula AS cliente_cedula
  FROM cargos ca
  JOIN clientes c ON c.id = ca.cliente_id
`;

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
      ca.numero_cargo ILIKE $${params.length}
      OR ca.concepto ILIKE $${params.length}
      OR CONCAT_WS(' ', c.nombre, c.apellido) ILIKE $${params.length}
      OR c.cedula ILIKE $${params.length}
    )`);
  }

  if (estado) {
    params.push(estado);
    conditions.push(`ca.estado = $${params.length}`);
  }

  return runPagedFind({
    pool,
    selectSql: `SELECT ca.id, ca.numero_cargo, ca.cliente_id, ca.cliente_membresia_id, ca.concepto,
         ca.monto, ca.fecha_generacion, ca.fecha_vencimiento, ca.estado,
         ca.created_at, ca.updated_at,
         c.nombre AS cliente_nombre, c.apellido AS cliente_apellido, c.cedula AS cliente_cedula`,
    fromSql: 'FROM cargos ca JOIN clientes c ON c.id = ca.cliente_id',
    whereSql: conditions.join(' AND '),
    params,
    orderSql: 'ca.created_at DESC',
    statsSql: `COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE ca.estado = 'Pendiente')::int AS pendientes,
       COUNT(*) FILTER (WHERE ca.estado = 'Pagado')::int AS pagados,
       COALESCE(SUM(ca.monto) FILTER (WHERE ca.estado = 'Pendiente'), 0)::float AS monto_pendiente`,
    page,
    limit,
  });
};

const findById = async (id) => {
  const { rows } = await pool.query(`${SELECT_JOIN} WHERE ca.id = $1`, [id]);
  return rows[0] || null;
};

const create = async ({ cliente_id }) => {
  const { rows: clienteRows } = await pool.query('SELECT * FROM clientes WHERE id = $1', [cliente_id]);
  const cliente = clienteRows[0];
  if (!cliente) { const err = new Error('Cliente no encontrado'); err.status = 404; throw err; }
  if (cliente.estado !== 'Activo' || cliente.archivado) {
    const err = new Error('El cliente no está activo'); err.status = 400; throw err;
  }

  const { rows: membresiaRows } = await pool.query(
    `SELECT cm.*, m.nombre AS membresia_nombre
     FROM cliente_membresias cm
     JOIN membresias m ON m.id = cm.membresia_id
     WHERE cm.cliente_id = $1 AND cm.estado = 'Activa' AND cm.fecha_vencimiento >= CURRENT_DATE
     ORDER BY cm.fecha_vencimiento DESC LIMIT 1`,
    [cliente_id]
  );
  const membresia = membresiaRows[0];
  if (!membresia) {
    const err = new Error('Este cliente no tiene una membresía activa asignada'); err.status = 400; throw err;
  }

  const { rows: pendienteRows } = await pool.query(
    `SELECT id FROM cargos WHERE cliente_membresia_id = $1 AND estado = 'Pendiente'`,
    [membresia.id]
  );
  if (pendienteRows.length > 0) {
    const err = new Error('Ya existe un cargo pendiente para esta membresía'); err.status = 400; throw err;
  }

  const { rows: seqRows } = await pool.query("SELECT nextval('cargos_id_seq') AS id");
  const id = seqRows[0].id;
  const numeroCargo = 'CARG-' + String(id).padStart(6, '0');
  const concepto = 'Membresía ' + membresia.membresia_nombre;

  await pool.query(
    `INSERT INTO cargos (id, numero_cargo, cliente_id, cliente_membresia_id, concepto, monto, fecha_vencimiento)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, numeroCargo, cliente_id, membresia.id, concepto, membresia.precio, membresia.fecha_vencimiento]
  );

  return findById(id);
};

const cancelar = async (id) => {
  const { rows } = await pool.query(
    `UPDATE cargos SET estado = 'Cancelado', updated_at = NOW()
     WHERE id = $1 AND estado = 'Pendiente'
     RETURNING id`,
    [id]
  );
  if (!rows[0]) return null;
  return findById(rows[0].id);
};

module.exports = { findAll, findById, create, cancelar };
