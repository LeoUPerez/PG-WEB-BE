const pool = require('../config/db');
const { runPagedFind } = require('../utils/pagination');

const SELECT_JOIN = `
  SELECT co.id, co.numero_compra, co.proveedor_id, co.fecha_compra,
         co.monto_total, co.estado, co.created_at, co.updated_at,
         p.nombre AS proveedor_nombre, p.rnc AS proveedor_rnc
  FROM compras co
  JOIN proveedores p ON p.id = co.proveedor_id
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
      co.numero_compra ILIKE $${params.length}
      OR p.nombre ILIKE $${params.length}
    )`);
  }

  if (estado) {
    params.push(estado);
    conditions.push(`co.estado = $${params.length}`);
  }

  return runPagedFind({
    pool,
    selectSql: `SELECT co.id, co.numero_compra, co.proveedor_id, co.fecha_compra,
         co.monto_total, co.estado, co.created_at, co.updated_at,
         p.nombre AS proveedor_nombre, p.rnc AS proveedor_rnc`,
    fromSql: `FROM compras co
  JOIN proveedores p ON p.id = co.proveedor_id`,
    whereSql: conditions.join(' AND '),
    params,
    orderSql: 'co.created_at DESC',
    statsSql: `COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE co.estado = 'Completada')::int AS completadas,
       COUNT(*) FILTER (WHERE co.estado = 'Pendiente')::int AS pendientes,
       COALESCE(SUM(co.monto_total) FILTER (WHERE co.estado = 'Completada'), 0)::float AS monto_total`,
    page,
    limit,
  });
};

const findById = async (id) => {
  const { rows } = await pool.query(`${SELECT_JOIN} WHERE co.id = $1`, [id]);
  const compra = rows[0];
  if (!compra) return null;

  const { rows: detalle } = await pool.query(
    `SELECT cd.id, cd.producto_id, cd.cantidad, cd.costo_unitario, cd.subtotal,
            pr.codigo AS producto_codigo, pr.nombre AS producto_nombre
     FROM compra_detalle cd
     JOIN productos pr ON pr.id = cd.producto_id
     WHERE cd.compra_id = $1
     ORDER BY cd.id`,
    [id]
  );
  compra.detalle = detalle;
  return compra;
};

const findProductosActivos = async ({ proveedor_id = '' } = {}) => {
  const params = [];
  const conditions = [`estado = 'Activo'`];
  if (proveedor_id) {
    params.push(Number(proveedor_id));
    conditions.push(`proveedor_id = $${params.length}`);
  }
  const { rows } = await pool.query(
    `SELECT id, codigo, nombre, precio_compra, stock, proveedor_id
     FROM productos WHERE ${conditions.join(' AND ')} ORDER BY nombre ASC`,
    params
  );
  return rows;
};

const create = async ({ proveedor_id, detalle, estado = 'Completada' }) => {
  if (!['Pendiente', 'Completada'].includes(estado)) {
    const err = new Error('Estado inválido'); err.status = 400; throw err;
  }

  const { rows: provRows } = await pool.query(
    "SELECT * FROM proveedores WHERE id = $1 AND estado = 'Activo'",
    [proveedor_id]
  );
  if (!provRows[0]) { const err = new Error('Proveedor no válido'); err.status = 400; throw err; }

  if (!Array.isArray(detalle) || detalle.length === 0) {
    const err = new Error('Agrega al menos un producto a la compra'); err.status = 400; throw err;
  }

  const productoIds = detalle.map((d) => Number(d.producto_id));
  const { rows: productoRows } = await pool.query(
    `SELECT * FROM productos WHERE id = ANY($1::int[]) AND estado = 'Activo'`,
    [productoIds]
  );
  const productosPorId = new Map(productoRows.map((p) => [p.id, p]));

  const lineas = [];
  let montoTotal = 0;
  for (const d of detalle) {
    const productoId = Number(d.producto_id);
    const cantidad = Number(d.cantidad);
    const costoUnitario = Number(d.costo_unitario);
    const producto = productosPorId.get(productoId);
    if (!producto) { const err = new Error('Uno o más productos no son válidos'); err.status = 400; throw err; }
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
  montoTotal = Math.round(montoTotal * 100) / 100;

  const { rows: seqRows } = await pool.query("SELECT nextval('compras_id_seq') AS id");
  const id = seqRows[0].id;
  const numeroCompra = 'COM-' + String(id).padStart(6, '0');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO compras (id, numero_compra, proveedor_id, monto_total, estado)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, numeroCompra, proveedor_id, montoTotal, estado]
    );

    for (const linea of lineas) {
      await client.query(
        `INSERT INTO compra_detalle (compra_id, producto_id, cantidad, costo_unitario, subtotal)
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

const anular = async (id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: compraRows } = await client.query('SELECT * FROM compras WHERE id = $1 FOR UPDATE', [id]);
    const compra = compraRows[0];
    if (!compra) { await client.query('ROLLBACK'); return null; }
    if (!['Pendiente', 'Completada'].includes(compra.estado)) {
      const err = new Error('Esta compra ya fue anulada'); err.status = 400; throw err;
    }

    if (compra.estado === 'Completada') {
      const { rows: detalleRows } = await client.query(
        'SELECT producto_id, cantidad FROM compra_detalle WHERE compra_id = $1',
        [id]
      );
      for (const d of detalleRows) {
        await client.query(
          `UPDATE productos SET stock = GREATEST(stock - $1, 0), updated_at = NOW() WHERE id = $2`,
          [d.cantidad, d.producto_id]
        );
      }
    }

    await client.query("UPDATE compras SET estado = 'Anulada', updated_at = NOW() WHERE id = $1", [id]);

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

    const { rows: compraRows } = await client.query('SELECT * FROM compras WHERE id = $1 FOR UPDATE', [id]);
    const compra = compraRows[0];
    if (!compra) { await client.query('ROLLBACK'); return null; }
    if (compra.estado !== 'Pendiente') {
      const err = new Error('Solo se pueden recibir compras pendientes'); err.status = 400; throw err;
    }

    const { rows: detalleRows } = await client.query(
      'SELECT producto_id, cantidad FROM compra_detalle WHERE compra_id = $1',
      [id]
    );
    for (const d of detalleRows) {
      await client.query(
        `UPDATE productos SET stock = stock + $1, updated_at = NOW() WHERE id = $2`,
        [d.cantidad, d.producto_id]
      );
    }

    await client.query("UPDATE compras SET estado = 'Completada', updated_at = NOW() WHERE id = $1", [id]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return findById(id);
};

module.exports = { findAll, findById, findProductosActivos, create, anular, recibir };
