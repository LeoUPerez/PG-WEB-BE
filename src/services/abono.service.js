const pool = require('../config/db');
const { runPagedFind } = require('../utils/pagination');

const SELECT_FIELDS = `
  a.id, a.numero_abono, a.cargo_id, a.cliente_id, a.metodo_pago_id, a.monto,
  a.fecha_abono, a.comprobante_url, a.created_by, a.created_at, a.updated_at,
  c.nombre AS cliente_nombre, c.apellido AS cliente_apellido, c.cedula AS cliente_cedula,
  ca.numero_cargo, ca.concepto AS cargo_concepto, ca.monto AS cargo_monto,
  mp.nombre AS metodo_pago_nombre
`;
const FROM_JOIN = `
  FROM abonos a
  JOIN clientes c ON c.id = a.cliente_id
  JOIN cargos ca ON ca.id = a.cargo_id
  JOIN metodos_pago mp ON mp.id = a.metodo_pago_id
`;

const findAll = async ({ page = null, limit = null, search = '', fecha_desde = '', fecha_hasta = '', cliente_id = '' } = {}) => {
  const params = [];
  const conditions = ['TRUE'];

  if (cliente_id) {
    params.push(cliente_id);
    conditions.push(`a.cliente_id = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(
      a.numero_abono ILIKE $${params.length}
      OR ca.numero_cargo ILIKE $${params.length}
      OR CONCAT_WS(' ', c.nombre, c.apellido) ILIKE $${params.length}
      OR c.cedula ILIKE $${params.length}
    )`);
  }

  if (fecha_desde) {
    params.push(fecha_desde);
    conditions.push(`a.fecha_abono::date >= $${params.length}`);
  }

  if (fecha_hasta) {
    params.push(fecha_hasta);
    conditions.push(`a.fecha_abono::date <= $${params.length}`);
  }

  return runPagedFind({
    pool,
    selectSql: `SELECT ${SELECT_FIELDS}`,
    fromSql: FROM_JOIN,
    whereSql: conditions.join(' AND '),
    params,
    orderSql: 'a.created_at DESC',
    statsSql: `COUNT(*)::int AS total,
       COALESCE(SUM(a.monto), 0)::float AS monto_total`,
    page,
    limit,
  });
};

const findById = async (id) => {
  const { rows } = await pool.query(`SELECT ${SELECT_FIELDS} ${FROM_JOIN} WHERE a.id = $1`, [id]);
  return rows[0] || null;
};

/** Saldo pendiente de un cargo: monto original menos la suma de sus abonos. */
const saldoPendienteCargo = async (client, cargoId) => {
  const { rows } = await client.query(
    `SELECT ca.monto, COALESCE(SUM(a.monto), 0) AS abonado
     FROM cargos ca
     LEFT JOIN abonos a ON a.cargo_id = ca.id
     WHERE ca.id = $1
     GROUP BY ca.id, ca.monto`,
    [cargoId]
  );
  if (!rows[0]) return null;
  const monto = Number(rows[0].monto);
  const abonado = Number(rows[0].abonado);
  return Math.round((monto - abonado) * 100) / 100;
};

/** Cargos pendientes de un cliente con su saldo restante (considerando abonos ya hechos). */
const findCargosConSaldo = async (clienteId) => {
  const { rows } = await pool.query(
    `SELECT ca.id, ca.numero_cargo, ca.concepto, ca.monto, ca.fecha_vencimiento,
            COALESCE(SUM(a.monto), 0)::float AS abonado
     FROM cargos ca
     LEFT JOIN abonos a ON a.cargo_id = ca.id
     WHERE ca.cliente_id = $1 AND ca.estado = 'Pendiente'
     GROUP BY ca.id
     ORDER BY ca.fecha_vencimiento ASC`,
    [clienteId]
  );
  return rows.map((r) => ({
    ...r,
    saldo_pendiente: Math.round((Number(r.monto) - Number(r.abonado)) * 100) / 100,
  }));
};

/** Estado de cuenta: clientes con saldo pendiente, para el reporte de Cuentas por Cobrar. */
const findCuentasPorCobrar = async () => {
  const { rows } = await pool.query(
    `SELECT c.id AS cliente_id, c.nombre, c.apellido, c.cedula,
            COUNT(ca.id)::int AS cargos_pendientes,
            COALESCE(SUM(ca.monto), 0)::float AS monto_total,
            COALESCE(SUM(ab.abonado), 0)::float AS monto_abonado,
            COALESCE(SUM(ca.monto), 0)::float - COALESCE(SUM(ab.abonado), 0)::float AS saldo_pendiente,
            MIN(ca.fecha_vencimiento) AS proximo_vencimiento
     FROM cargos ca
     JOIN clientes c ON c.id = ca.cliente_id
     LEFT JOIN LATERAL (
       SELECT COALESCE(SUM(a.monto), 0) AS abonado
       FROM abonos a WHERE a.cargo_id = ca.id
     ) ab ON TRUE
     WHERE ca.estado = 'Pendiente'
     GROUP BY c.id, c.nombre, c.apellido, c.cedula
     HAVING COALESCE(SUM(ca.monto), 0)::float - COALESCE(SUM(ab.abonado), 0)::float > 0
     ORDER BY saldo_pendiente DESC`
  );
  return rows;
};

const registrar = async ({ cargo_id, metodo_pago_id, monto, comprobante_url = null, created_by }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: cargoRows } = await client.query('SELECT * FROM cargos WHERE id = $1 FOR UPDATE', [cargo_id]);
    const cargo = cargoRows[0];
    if (!cargo) { const err = new Error('Cargo no encontrado'); err.status = 404; throw err; }
    if (cargo.estado !== 'Pendiente') {
      const err = new Error('Este cargo ya no está pendiente'); err.status = 400; throw err;
    }

    const { rows: metodoRows } = await client.query(
      "SELECT * FROM metodos_pago WHERE id = $1 AND estado = 'Activo'",
      [metodo_pago_id]
    );
    const metodo = metodoRows[0];
    if (!metodo) { const err = new Error('Método de pago no válido'); err.status = 400; throw err; }
    if (metodo.nombre === 'Transferencia' && !comprobante_url) {
      const err = new Error('Adjunta el comprobante de la transferencia'); err.status = 400; throw err;
    }

    const saldo = await saldoPendienteCargo(client, cargo_id);
    const montoAbono = Math.round(Number(monto) * 100) / 100;
    if (!Number.isFinite(montoAbono) || montoAbono <= 0) {
      const err = new Error('El monto del abono debe ser mayor a cero'); err.status = 400; throw err;
    }
    if (montoAbono > saldo) {
      const err = new Error(`El abono no puede superar el saldo pendiente (RD$${saldo.toFixed(2)})`);
      err.status = 400;
      throw err;
    }

    const { rows: seqRows } = await client.query("SELECT nextval('abonos_id_seq') AS id");
    const id = seqRows[0].id;
    const numeroAbono = 'ABO-' + String(id).padStart(6, '0');

    await client.query(
      `INSERT INTO abonos (id, numero_abono, cargo_id, cliente_id, metodo_pago_id, monto, comprobante_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, numeroAbono, cargo_id, cargo.cliente_id, metodo_pago_id, montoAbono, comprobante_url]
    );

    const saldoRestante = Math.round((saldo - montoAbono) * 100) / 100;
    if (saldoRestante <= 0) {
      await client.query(
        "UPDATE cargos SET estado = 'Pagado', updated_at = NOW() WHERE id = $1",
        [cargo_id]
      );
    }

    await client.query('COMMIT');
    return { id, saldoRestante };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  findAll,
  findById,
  findCargosConSaldo,
  findCuentasPorCobrar,
  registrar,
};
