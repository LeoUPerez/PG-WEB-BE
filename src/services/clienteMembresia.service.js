const pool = require('../config/db');

const SELECT_JOIN = `
  SELECT cm.id, cm.cliente_id, cm.membresia_id, cm.fecha_inicio, cm.fecha_vencimiento,
         cm.precio, cm.estado, cm.created_at, cm.updated_at,
         c.nombre AS cliente_nombre, c.apellido AS cliente_apellido, c.cedula AS cliente_cedula,
         m.nombre AS membresia_nombre, m.duracion_dias AS membresia_duracion_dias
  FROM cliente_membresias cm
  JOIN clientes c ON c.id = cm.cliente_id
  JOIN membresias m ON m.id = cm.membresia_id
`;

const findAll = async () => {
  const { rows } = await pool.query(`${SELECT_JOIN} ORDER BY cm.created_at DESC`);
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(`${SELECT_JOIN} WHERE cm.id = $1`, [id]);
  return rows[0] || null;
};

const findActivaByCliente = async (clienteId) => {
  const { rows } = await pool.query(
    `${SELECT_JOIN} WHERE cm.cliente_id = $1 AND cm.estado = 'Activa' AND cm.fecha_vencimiento >= CURRENT_DATE
     ORDER BY cm.fecha_vencimiento DESC LIMIT 1`,
    [clienteId]
  );
  return rows[0] || null;
};

const findUltimaByCliente = async (clienteId) => {
  const { rows } = await pool.query(
    `${SELECT_JOIN} WHERE cm.cliente_id = $1
     ORDER BY cm.created_at DESC, cm.id DESC LIMIT 1`,
    [clienteId]
  );
  return rows[0] || null;
};

const findUltimaPorCliente = async () => {
  const { rows } = await pool.query(
    `SELECT DISTINCT ON (cm.cliente_id) cm.id, cm.cliente_id, cm.membresia_id, cm.fecha_inicio, cm.fecha_vencimiento,
            cm.precio, cm.estado, cm.created_at, cm.updated_at,
            c.nombre AS cliente_nombre, c.apellido AS cliente_apellido, c.cedula AS cliente_cedula,
            m.nombre AS membresia_nombre, m.duracion_dias AS membresia_duracion_dias
     FROM cliente_membresias cm
     JOIN clientes c ON c.id = cm.cliente_id
     JOIN membresias m ON m.id = cm.membresia_id
     WHERE c.archivado = false
     ORDER BY cm.cliente_id, cm.created_at DESC, cm.id DESC`
  );
  return rows;
};

const create = async ({ cliente_id, membresia_id, fecha_inicio, confirmar_reemplazo }) => {
  const { rows: clienteRows } = await pool.query(
    'SELECT * FROM clientes WHERE id = $1',
    [cliente_id]
  );
  const cliente = clienteRows[0];
  if (!cliente) { const err = new Error('Cliente no encontrado'); err.status = 404; throw err; }
  if (cliente.estado !== 'Activo' || cliente.archivado) {
    const err = new Error('El cliente no está activo'); err.status = 400; throw err;
  }

  const { rows: membresiaRows } = await pool.query(
    'SELECT * FROM membresias WHERE id = $1',
    [membresia_id]
  );
  const membresia = membresiaRows[0];
  if (!membresia) { const err = new Error('Membresía no encontrada'); err.status = 404; throw err; }
  if (membresia.estado !== 'Activo' || membresia.archivado) {
    const err = new Error('La membresía no está activa'); err.status = 400; throw err;
  }

  const activa = await findActivaByCliente(cliente_id);
  if (activa && !confirmar_reemplazo) {
    const err = new Error('Este cliente ya tiene una membresía activa.');
    err.status = 409;
    err.requiereConfirmacion = true;
    err.membresiaActual = activa;
    throw err;
  }

  const inicio = new Date(fecha_inicio);
  const vencimiento = new Date(inicio);
  vencimiento.setDate(vencimiento.getDate() + Number(membresia.duracion_dias));
  const fechaVencimientoStr = vencimiento.toISOString().slice(0, 10);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (activa) {
      await client.query(
        `UPDATE cliente_membresias SET estado = 'Cancelada', updated_at = NOW() WHERE id = $1`,
        [activa.id]
      );
    }
    const { rows } = await client.query(
      `INSERT INTO cliente_membresias (cliente_id, membresia_id, fecha_inicio, fecha_vencimiento, precio)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [cliente_id, membresia_id, fecha_inicio, fechaVencimientoStr, membresia.precio]
    );
    await client.query('COMMIT');
    return findById(rows[0].id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const cancelar = async (id) => {
  const { rows } = await pool.query(
    `UPDATE cliente_membresias SET estado = 'Cancelada', updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [id]
  );
  if (!rows[0]) return null;
  return findById(rows[0].id);
};

module.exports = { findAll, findById, findActivaByCliente, findUltimaByCliente, findUltimaPorCliente, create, cancelar };
