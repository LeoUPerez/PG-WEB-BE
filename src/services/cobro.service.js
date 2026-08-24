const crypto = require('crypto');
const pool = require('../config/db');
const { runPagedFind } = require('../utils/pagination');
const emailService = require('./email.service');

const SELECT_JOIN = `
  SELECT co.id, co.numero_cobro, co.cliente_id, co.metodo_pago_id, co.fecha_cobro,
         co.monto_total, co.estado, co.email_pago, co.comprobante_url, co.created_at, co.updated_at,
         c.nombre AS cliente_nombre, c.apellido AS cliente_apellido, c.cedula AS cliente_cedula,
         mp.nombre AS metodo_pago_nombre
  FROM cobros co
  JOIN clientes c ON c.id = co.cliente_id
  JOIN metodos_pago mp ON mp.id = co.metodo_pago_id
`;

const findAll = async ({
  page = null,
  limit = null,
  search = '',
  estado = '',
  fecha_desde = '',
  fecha_hasta = '',
} = {}) => {
  const params = [];
  const conditions = ['TRUE'];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(
      co.numero_cobro ILIKE $${params.length}
      OR CONCAT_WS(' ', c.nombre, c.apellido) ILIKE $${params.length}
      OR c.cedula ILIKE $${params.length}
      OR mp.nombre ILIKE $${params.length}
    )`);
  }

  if (estado) {
    params.push(estado);
    conditions.push(`co.estado = $${params.length}`);
  }

  if (fecha_desde) {
    params.push(fecha_desde);
    conditions.push(`co.fecha_cobro::date >= $${params.length}`);
  }

  if (fecha_hasta) {
    params.push(fecha_hasta);
    conditions.push(`co.fecha_cobro::date <= $${params.length}`);
  }

  return runPagedFind({
    pool,
    selectSql: `SELECT co.id, co.numero_cobro, co.cliente_id, co.metodo_pago_id, co.fecha_cobro,
         co.monto_total, co.estado, co.comprobante_url, co.created_at, co.updated_at,
         c.nombre AS cliente_nombre, c.apellido AS cliente_apellido, c.cedula AS cliente_cedula,
         mp.nombre AS metodo_pago_nombre`,
    fromSql: `FROM cobros co
  JOIN clientes c ON c.id = co.cliente_id
  JOIN metodos_pago mp ON mp.id = co.metodo_pago_id`,
    whereSql: conditions.join(' AND '),
    params,
    orderSql: 'co.created_at DESC',
    statsSql: `COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE co.estado = 'Completado')::int AS completados,
       COUNT(*) FILTER (WHERE co.estado = 'Pendiente')::int AS pendientes,
       COALESCE(SUM(co.monto_total) FILTER (WHERE co.estado = 'Completado'), 0)::float AS monto_total`,
    page,
    limit,
  });
};

const findById = async (id) => {
  const { rows } = await pool.query(`${SELECT_JOIN} WHERE co.id = $1`, [id]);
  const cobro = rows[0];
  if (!cobro) return null;

  const { rows: detalle } = await pool.query(
    'SELECT id, cargo_id, concepto, monto FROM cobro_detalle WHERE cobro_id = $1 ORDER BY id',
    [id]
  );
  cobro.detalle = detalle;
  return cobro;
};

const findByToken = async (token) => {
  const { rows } = await pool.query(`${SELECT_JOIN} WHERE co.token = $1`, [token]);
  const cobro = rows[0];
  if (!cobro) return null;

  const { rows: detalle } = await pool.query(
    'SELECT id, cargo_id, concepto, monto FROM cobro_detalle WHERE cobro_id = $1 ORDER BY id',
    [cobro.id]
  );
  cobro.detalle = detalle;
  return cobro;
};

const findPendientesByCliente = async (clienteId) => {
  const { rows } = await pool.query(
    `SELECT id, numero_cargo, concepto, monto, fecha_vencimiento
     FROM cargos
     WHERE cliente_id = $1 AND estado = 'Pendiente'
     ORDER BY fecha_vencimiento ASC`,
    [clienteId]
  );
  return rows;
};

const findMetodosPago = async () => {
  const { rows } = await pool.query(
    `SELECT id, nombre FROM metodos_pago WHERE estado = 'Activo' ORDER BY nombre ASC`
  );
  return rows;
};

const create = async ({
  cliente_id,
  metodo_pago_id,
  cargo_ids,
  estado = 'Completado',
  email_pago = null,
  comprobante_url = null,
}) => {
  if (!['Pendiente', 'Completado'].includes(estado)) {
    const err = new Error('Estado inválido'); err.status = 400; throw err;
  }

  const { rows: clienteRows } = await pool.query('SELECT * FROM clientes WHERE id = $1', [cliente_id]);
  const cliente = clienteRows[0];
  if (!cliente) { const err = new Error('Cliente no encontrado'); err.status = 404; throw err; }

  const { rows: metodoRows } = await pool.query(
    "SELECT * FROM metodos_pago WHERE id = $1 AND estado = 'Activo'",
    [metodo_pago_id]
  );
  const metodo = metodoRows[0];
  if (!metodo) { const err = new Error('Método de pago no válido'); err.status = 400; throw err; }

  if (metodo.nombre === 'Transferencia' && !comprobante_url) {
    const err = new Error('Debes adjuntar el comprobante de la transferencia'); err.status = 400; throw err;
  }

  if (!Array.isArray(cargo_ids) || cargo_ids.length === 0) {
    const err = new Error('Selecciona al menos un cargo a cobrar'); err.status = 400; throw err;
  }

  const { rows: cargoRows } = await pool.query(
    `SELECT * FROM cargos WHERE id = ANY($1::int[]) AND cliente_id = $2 AND estado = 'Pendiente'`,
    [cargo_ids, cliente_id]
  );
  if (cargoRows.length !== cargo_ids.length) {
    const err = new Error('Uno o más cargos ya no están pendientes'); err.status = 400; throw err;
  }

  const montoTotal = cargoRows.reduce((sum, c) => sum + Number(c.monto), 0);

  const { rows: seqRows } = await pool.query("SELECT nextval('cobros_id_seq') AS id");
  const id = seqRows[0].id;
  const numeroCobro = 'COB-' + String(id).padStart(6, '0');
  const token = estado === 'Pendiente' ? crypto.randomBytes(32).toString('hex') : null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO cobros (id, numero_cobro, cliente_id, metodo_pago_id, monto_total, estado, token, email_pago, comprobante_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, numeroCobro, cliente_id, metodo_pago_id, montoTotal, estado, token, email_pago, comprobante_url]
    );

    for (const cargo of cargoRows) {
      await client.query(
        'INSERT INTO cobro_detalle (cobro_id, cargo_id, concepto, monto) VALUES ($1, $2, $3, $4)',
        [id, cargo.id, cargo.concepto, cargo.monto]
      );
      if (estado === 'Completado') {
        await client.query(
          "UPDATE cargos SET estado = 'Pagado', updated_at = NOW() WHERE id = $1",
          [cargo.id]
        );
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const cobro = await findById(id);

  if (estado === 'Pendiente' && email_pago) {
    const link = `${(process.env.FRONTEND_URL || '').replace(/\/$/, '')}/pagar_cobro.php?token=${token}`;
    try {
      await emailService.enviarCotizacionCobro({
        destinatario: email_pago,
        nombre: cliente.nombre,
        numeroCobro,
        lineas: cobro.detalle.map((d) => ({ concepto: d.concepto, monto: d.monto })),
        montoTotal,
        link,
      });
    } catch (err) {
      console.error('No se pudo enviar el correo de cotización de cobro:', err.message);
    }
  }

  return cobro;
};

const procesarPago = async (token) => {
  const client = await pool.connect();
  let cobroId = null;
  try {
    await client.query('BEGIN');

    const { rows: cobroRows } = await client.query('SELECT * FROM cobros WHERE token = $1 FOR UPDATE', [token]);
    const cobro = cobroRows[0];
    if (!cobro) { await client.query('ROLLBACK'); return null; }
    cobroId = cobro.id;
    if (cobro.estado !== 'Pendiente') {
      const err = new Error('Este cobro ya fue procesado.'); err.status = 400; throw err;
    }

    const { rows: detalleRows } = await client.query(
      'SELECT cargo_id FROM cobro_detalle WHERE cobro_id = $1 AND cargo_id IS NOT NULL',
      [cobro.id]
    );
    for (const d of detalleRows) {
      await client.query(
        "UPDATE cargos SET estado = 'Pagado', updated_at = NOW() WHERE id = $1 AND estado = 'Pendiente'",
        [d.cargo_id]
      );
    }

    await client.query("UPDATE cobros SET estado = 'Completado', updated_at = NOW() WHERE id = $1", [cobro.id]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return findById(cobroId);
};

const anular = async (id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: cobroRows } = await client.query('SELECT * FROM cobros WHERE id = $1 FOR UPDATE', [id]);
    const cobro = cobroRows[0];
    if (!cobro) { await client.query('ROLLBACK'); return null; }
    if (!['Pendiente', 'Completado'].includes(cobro.estado)) {
      const err = new Error('Este cobro ya fue anulado'); err.status = 400; throw err;
    }

    if (cobro.estado === 'Completado') {
      const { rows: detalleRows } = await client.query(
        'SELECT cargo_id FROM cobro_detalle WHERE cobro_id = $1 AND cargo_id IS NOT NULL',
        [id]
      );
      for (const d of detalleRows) {
        await client.query(
          "UPDATE cargos SET estado = 'Pendiente', updated_at = NOW() WHERE id = $1 AND estado = 'Pagado'",
          [d.cargo_id]
        );
      }
    }

    await client.query("UPDATE cobros SET estado = 'Anulado', updated_at = NOW() WHERE id = $1", [id]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return findById(id);
};

module.exports = {
  findAll,
  findById,
  findByToken,
  findPendientesByCliente,
  findMetodosPago,
  create,
  procesarPago,
  anular,
};
