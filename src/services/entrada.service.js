const pool = require('../config/db');
const { runPagedFind } = require('../utils/pagination');

const SELECT_JOIN = `
  SELECT e.id, e.numero_entrada, e.proveedor_id, e.fecha_entrada,
         e.monto_total, e.referencia, e.estado, e.created_at, e.updated_at,
         p.nombre AS proveedor_nombre, p.rnc AS proveedor_rnc
  FROM entradas e
  JOIN proveedores p ON p.id = e.proveedor_id
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
      e.numero_entrada ILIKE $${params.length}
      OR COALESCE(e.referencia, '') ILIKE $${params.length}
      OR p.nombre ILIKE $${params.length}
    )`);
  }

  if (estado) {
    params.push(estado);
    conditions.push(`e.estado = $${params.length}`);
  }

  if (fecha_desde) {
    params.push(fecha_desde);
    conditions.push(`e.fecha_entrada::date >= $${params.length}`);
  }

  if (fecha_hasta) {
    params.push(fecha_hasta);
    conditions.push(`e.fecha_entrada::date <= $${params.length}`);
  }

  return runPagedFind({
    pool,
    selectSql: `SELECT e.id, e.numero_entrada, e.proveedor_id, e.fecha_entrada,
         e.monto_total, e.referencia, e.estado, e.created_at, e.updated_at,
         p.nombre AS proveedor_nombre, p.rnc AS proveedor_rnc`,
    fromSql: `FROM entradas e
  JOIN proveedores p ON p.id = e.proveedor_id`,
    whereSql: conditions.join(' AND '),
    params,
    orderSql: 'e.created_at DESC',
    statsSql: `COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE e.estado = 'Pendiente')::int AS pendientes,
       COUNT(*) FILTER (WHERE e.estado = 'Completada')::int AS completadas,
       COUNT(*) FILTER (WHERE e.estado = 'Anulada')::int AS anuladas,
       COALESCE(SUM(e.monto_total) FILTER (WHERE e.estado = 'Completada'), 0)::float AS monto_total`,
    page,
    limit,
  });
};

const findById = async (id) => {
  const { rows } = await pool.query(`${SELECT_JOIN} WHERE e.id = $1`, [id]);
  const entrada = rows[0];
  if (!entrada) return null;

  const { rows: detalle } = await pool.query(
    `SELECT ed.id, ed.producto_id, ed.cantidad, ed.costo_unitario, ed.subtotal,
            pr.codigo AS producto_codigo, pr.nombre AS producto_nombre, pr.imagen AS producto_imagen
     FROM entrada_detalle ed
     JOIN productos pr ON pr.id = ed.producto_id
     WHERE ed.entrada_id = $1
     ORDER BY ed.id`,
    [id]
  );
  entrada.detalle = detalle;
  return entrada;
};

const findProductosActivos = async ({ proveedor_id = '' } = {}) => {
  const params = [];
  const conditions = [`estado = 'Activo'`];
  if (proveedor_id) {
    params.push(Number(proveedor_id));
    conditions.push(`proveedor_id = $${params.length}`);
  }
  const { rows } = await pool.query(
    `SELECT id, codigo, nombre, precio_compra, stock, proveedor_id, imagen
     FROM productos WHERE ${conditions.join(' AND ')} ORDER BY nombre ASC`,
    params
  );
  return rows;
};

const buildLineas = async (proveedor_id, detalle) => {
  if (!Array.isArray(detalle) || detalle.length === 0) {
    const err = new Error('Agrega al menos un producto a la entrada'); err.status = 400; throw err;
  }

  const productoIds = detalle.map((d) => Number(d.producto_id));
  const { rows: productoRows } = await pool.query(
    `SELECT * FROM productos WHERE id = ANY($1::int[]) AND estado = 'Activo'`,
    [productoIds]
  );
  const productosPorId = new Map(productoRows.map((p) => [p.id, p]));

  const lineas = [];
  let montoTotal = 0;
  const productosEnDetalle = new Set();
  for (const d of detalle) {
    const productoId = Number(d.producto_id);
    const cantidad = Number(d.cantidad);
    const costoUnitario = Number(d.costo_unitario);
    const producto = productosPorId.get(productoId);
    if (!producto) { const err = new Error('Uno o más productos no son válidos'); err.status = 400; throw err; }
    if (productosEnDetalle.has(productoId)) {
      const err = new Error(`"${producto.nombre}" está repetido. Usa una sola línea y ajusta la cantidad.`);
      err.status = 400;
      throw err;
    }
    productosEnDetalle.add(productoId);
    if (producto.proveedor_id && Number(producto.proveedor_id) !== Number(proveedor_id)) {
      const err = new Error(`"${producto.nombre}" no pertenece al proveedor seleccionado`); err.status = 400; throw err;
    }
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      const err = new Error(`La cantidad de "${producto.nombre}" debe ser mayor a cero`); err.status = 400; throw err;
    }
    if (!Number.isFinite(costoUnitario) || costoUnitario < 0) {
      const err = new Error(`El costo de "${producto.nombre}" no es válido`); err.status = 400; throw err;
    }
    const subtotal = Math.round(cantidad * costoUnitario * 100) / 100;
    montoTotal += subtotal;
    lineas.push({ productoId, cantidad, costoUnitario, subtotal });
  }
  return { lineas, montoTotal: Math.round(montoTotal * 100) / 100 };
};

const create = async ({ proveedor_id, detalle, referencia = null, estado = 'Completada' }) => {
  if (!['Pendiente', 'Completada'].includes(estado)) {
    const err = new Error('Estado inválido'); err.status = 400; throw err;
  }

  const { rows: provRows } = await pool.query(
    "SELECT * FROM proveedores WHERE id = $1 AND estado = 'Activo'",
    [proveedor_id]
  );
  if (!provRows[0]) { const err = new Error('Proveedor no válido'); err.status = 400; throw err; }

  const ref = referencia != null ? String(referencia).trim() : '';
  const referenciaFinal = ref === '' ? null : ref.slice(0, 100);
  const { lineas, montoTotal } = await buildLineas(proveedor_id, detalle);

  const { rows: seqRows } = await pool.query("SELECT nextval('entradas_id_seq') AS id");
  const id = seqRows[0].id;
  const numeroEntrada = 'ENT-' + String(id).padStart(6, '0');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO entradas (id, numero_entrada, proveedor_id, monto_total, referencia, estado)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, numeroEntrada, proveedor_id, montoTotal, referenciaFinal, estado]
    );

    for (const linea of lineas) {
      await client.query(
        `INSERT INTO entrada_detalle (entrada_id, producto_id, cantidad, costo_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, linea.productoId, linea.cantidad, linea.costoUnitario, linea.subtotal]
      );
      if (estado === 'Completada') {
        await client.query(
          `UPDATE productos SET stock = stock + $1, updated_at = NOW() WHERE id = $2`,
          [linea.cantidad, linea.productoId]
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

  return findById(id);
};

const update = async (id, { proveedor_id, detalle, referencia = null }) => {
  const { rows: entradaRows } = await pool.query('SELECT * FROM entradas WHERE id = $1', [id]);
  const entrada = entradaRows[0];
  if (!entrada) return null;
  if (entrada.estado !== 'Pendiente') {
    const err = new Error('Solo se pueden editar entradas en camino'); err.status = 400; throw err;
  }

  const { rows: provRows } = await pool.query(
    "SELECT * FROM proveedores WHERE id = $1 AND estado = 'Activo'",
    [proveedor_id]
  );
  if (!provRows[0]) { const err = new Error('Proveedor no válido'); err.status = 400; throw err; }

  const ref = referencia != null ? String(referencia).trim() : '';
  const referenciaFinal = ref === '' ? null : ref.slice(0, 100);
  const { lineas, montoTotal } = await buildLineas(proveedor_id, detalle);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: locked } = await client.query(
      'SELECT * FROM entradas WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (!locked[0] || locked[0].estado !== 'Pendiente') {
      const err = new Error('Solo se pueden editar entradas en camino'); err.status = 400; throw err;
    }

    await client.query(
      `UPDATE entradas
       SET proveedor_id = $1, referencia = $2, monto_total = $3, updated_at = NOW()
       WHERE id = $4`,
      [proveedor_id, referenciaFinal, montoTotal, id]
    );

    await client.query('DELETE FROM entrada_detalle WHERE entrada_id = $1', [id]);

    for (const linea of lineas) {
      await client.query(
        `INSERT INTO entrada_detalle (entrada_id, producto_id, cantidad, costo_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, linea.productoId, linea.cantidad, linea.costoUnitario, linea.subtotal]
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

const anular = async (id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: entradaRows } = await client.query('SELECT * FROM entradas WHERE id = $1 FOR UPDATE', [id]);
    const entrada = entradaRows[0];
    if (!entrada) { await client.query('ROLLBACK'); return null; }
    if (!['Pendiente', 'Completada'].includes(entrada.estado)) {
      const err = new Error('Esta entrada ya fue anulada'); err.status = 400; throw err;
    }

    if (entrada.estado === 'Completada') {
      const { rows: detalleRows } = await client.query(
        'SELECT producto_id, cantidad FROM entrada_detalle WHERE entrada_id = $1',
        [id]
      );
      for (const d of detalleRows) {
        await client.query(
          `UPDATE productos SET stock = GREATEST(stock - $1, 0), updated_at = NOW() WHERE id = $2`,
          [d.cantidad, d.producto_id]
        );
      }
    }

    await client.query("UPDATE entradas SET estado = 'Anulada', updated_at = NOW() WHERE id = $1", [id]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return findById(id);
};

const recibir = async (id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: entradaRows } = await client.query('SELECT * FROM entradas WHERE id = $1 FOR UPDATE', [id]);
    const entrada = entradaRows[0];
    if (!entrada) { await client.query('ROLLBACK'); return null; }
    if (entrada.estado !== 'Pendiente') {
      const err = new Error('Solo se puede confirmar la llegada de entradas en camino'); err.status = 400; throw err;
    }

    const { rows: detalleRows } = await client.query(
      'SELECT producto_id, cantidad FROM entrada_detalle WHERE entrada_id = $1',
      [id]
    );
    for (const d of detalleRows) {
      await client.query(
        `UPDATE productos SET stock = stock + $1, updated_at = NOW() WHERE id = $2`,
        [d.cantidad, d.producto_id]
      );
    }

    await client.query("UPDATE entradas SET estado = 'Completada', updated_at = NOW() WHERE id = $1", [id]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return findById(id);
};

module.exports = { findAll, findById, findProductosActivos, create, update, anular, recibir };
