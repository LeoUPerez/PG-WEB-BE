const pool = require('../config/db');

const SELECT_JOIN = `
  SELECT co.id, co.numero_cobro, co.cliente_id, co.metodo_pago_id, co.fecha_cobro,
         co.monto_total, co.estado, co.created_at, co.updated_at,
         c.nombre AS cliente_nombre, c.apellido AS cliente_apellido, c.cedula AS cliente_cedula,
         mp.nombre AS metodo_pago_nombre
  FROM cobros co
  JOIN clientes c ON c.id = co.cliente_id
  JOIN metodos_pago mp ON mp.id = co.metodo_pago_id
`;

const findAll = async () => {
  const { rows } = await pool.query(`${SELECT_JOIN} ORDER BY co.created_at DESC`);
  return rows;
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

const create = async ({ cliente_id, metodo_pago_id, cargo_ids }) => {
  const { rows: clienteRows } = await pool.query('SELECT * FROM clientes WHERE id = $1', [cliente_id]);
  const cliente = clienteRows[0];
  if (!cliente) { const err = new Error('Cliente no encontrado'); err.status = 404; throw err; }

  const { rows: metodoRows } = await pool.query(
    "SELECT * FROM metodos_pago WHERE id = $1 AND estado = 'Activo'",
    [metodo_pago_id]
  );
  if (!metodoRows[0]) { const err = new Error('Método de pago no válido'); err.status = 400; throw err; }

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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO cobros (id, numero_cobro, cliente_id, metodo_pago_id, monto_total)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, numeroCobro, cliente_id, metodo_pago_id, montoTotal]
    );

    for (const cargo of cargoRows) {
      await client.query(
        'INSERT INTO cobro_detalle (cobro_id, cargo_id, concepto, monto) VALUES ($1, $2, $3, $4)',
        [id, cargo.id, cargo.concepto, cargo.monto]
      );
      await client.query(
        "UPDATE cargos SET estado = 'Pagado', updated_at = NOW() WHERE id = $1",
        [cargo.id]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return findById(id);
};

module.exports = { findAll, findById, findPendientesByCliente, findMetodosPago, create };
