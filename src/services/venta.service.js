const crypto = require('crypto');
const pool = require('../config/db');
const { runPagedFind } = require('../utils/pagination');

const METODOS_PAGO_CONFIRMACION = ['Efectivo', 'Tarjeta', 'Transferencia'];
const ESTADOS_FILTRO = ['Pendiente', 'Pagada', 'Anulada', 'Entregada'];

const componerDireccion = ({
  ciudad_nombre = null,
  sector = null,
  calle = null,
  numero_casa = null,
  referencias = null,
} = {}) => {
  const partes = [];
  if (ciudad_nombre) partes.push(String(ciudad_nombre).trim());
  if (sector) partes.push(`Sector ${String(sector).trim()}`);
  if (calle) partes.push(`Calle ${String(calle).trim()}`);
  if (numero_casa) partes.push(`Casa/apto ${String(numero_casa).trim()}`);
  if (referencias) partes.push(`Ref: ${String(referencias).trim()}`);
  return partes.length ? partes.join(' · ') : null;
};

const normalizarDireccionDomicilio = async ({
  ciudad_id = null,
  ciudad_nombre = null,
  sector = null,
  calle = null,
  numero_casa = null,
  referencias = null,
  direccion_entrega = null,
} = {}) => {
  let ciudadId = ciudad_id ? Number(ciudad_id) : null;
  let ciudadNombre = ciudad_nombre ? String(ciudad_nombre).trim() : null;

  if (ciudadId) {
    const { rows } = await pool.query(
      `SELECT id, nombre FROM ciudades_entrega WHERE id = $1 AND activa = true`,
      [ciudadId]
    );
    if (!rows[0]) {
      const err = new Error('La ciudad seleccionada no está disponible para entrega');
      err.status = 400;
      throw err;
    }
    ciudadId = rows[0].id;
    ciudadNombre = rows[0].nombre;
  }

  const calleN = calle ? String(calle).trim() : '';
  const casaN = numero_casa ? String(numero_casa).trim() : '';
  const sectorN = sector ? String(sector).trim() : '';
  const refN = referencias ? String(referencias).trim() : '';

  if (!ciudadId || !ciudadNombre) {
    const err = new Error('Selecciona una ciudad con cobertura de entrega');
    err.status = 400;
    throw err;
  }
  if (!calleN || !casaN) {
    const err = new Error('Calle y número de casa/apto son obligatorios para domicilio');
    err.status = 400;
    throw err;
  }

  const compuesta = componerDireccion({
    ciudad_nombre: ciudadNombre,
    sector: sectorN || null,
    calle: calleN,
    numero_casa: casaN,
    referencias: refN || null,
  }) || (direccion_entrega ? String(direccion_entrega).trim() : null);

  return {
    ciudad_id: ciudadId,
    ciudad_nombre: ciudadNombre,
    sector: sectorN || null,
    calle: calleN,
    numero_casa: casaN,
    referencias: refN || null,
    direccion_entrega: compuesta,
  };
};

const SELECT_JOIN = `
  SELECT v.id, v.numero_venta, v.origen, v.cliente_id,
         v.comprador_nombre, v.comprador_apellido, v.comprador_email,
         v.comprador_telefono, v.comprador_cedula,
         v.tipo_entrega, v.direccion_entrega,
         v.ciudad_id, v.ciudad_nombre, v.sector, v.calle, v.numero_casa, v.referencias,
         v.estado, v.metodo_pago,
         v.total, v.token, v.tracking_status, v.porcentaje_entrega,
         v.created_at, v.updated_at,
         TRIM(CONCAT(COALESCE(c.nombre, ''), ' ', COALESCE(c.apellido, ''))) AS cliente_nombre
  FROM ventas v
  LEFT JOIN clientes c ON c.id = v.cliente_id
`;

const trackingFromPorcentaje = (pct) => {
  const n = Math.max(0, Math.min(100, Number(pct) || 0));
  if (n >= 100) return 'Entregada';
  if (n >= 75) return 'ListaRetiro';
  if (n >= 45) return 'EnCamino';
  if (n >= 15) return 'EnPreparacion';
  return 'Recibida';
};

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
      v.numero_venta ILIKE $${params.length}
      OR v.token ILIKE $${params.length}
      OR v.comprador_nombre ILIKE $${params.length}
      OR v.comprador_apellido ILIKE $${params.length}
      OR v.comprador_email ILIKE $${params.length}
      OR COALESCE(v.comprador_cedula, '') ILIKE $${params.length}
    )`);
  }

  if (estado && ESTADOS_FILTRO.includes(estado)) {
    params.push(estado);
    conditions.push(`v.estado = $${params.length}`);
  }

  return runPagedFind({
    pool,
    selectSql: `SELECT v.id, v.numero_venta, v.origen, v.cliente_id,
         v.comprador_nombre, v.comprador_apellido, v.comprador_email,
         v.comprador_telefono, v.comprador_cedula,
         v.tipo_entrega, v.direccion_entrega,
         v.ciudad_id, v.ciudad_nombre, v.sector, v.calle, v.numero_casa, v.referencias,
         v.estado, v.metodo_pago,
         v.total, v.token, v.tracking_status, v.porcentaje_entrega,
         v.created_at, v.updated_at,
         TRIM(CONCAT(COALESCE(c.nombre, ''), ' ', COALESCE(c.apellido, ''))) AS cliente_nombre`,
    fromSql: `FROM ventas v
  LEFT JOIN clientes c ON c.id = v.cliente_id`,
    whereSql: conditions.join(' AND '),
    params,
    orderSql: 'v.created_at DESC',
    statsSql: `COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE v.estado = 'Pagada')::int AS pagadas,
       COUNT(*) FILTER (WHERE v.estado = 'Pendiente')::int AS pendientes,
       COUNT(*) FILTER (WHERE v.estado = 'Entregada')::int AS entregadas,
       COALESCE(SUM(v.total) FILTER (WHERE v.estado IN ('Pagada', 'Entregada')), 0)::float AS monto_total`,
    page,
    limit,
  });
};

const findById = async (id) => {
  const { rows } = await pool.query(`${SELECT_JOIN} WHERE v.id = $1`, [id]);
  const venta = rows[0];
  if (!venta) return null;

  const { rows: detalle } = await pool.query(
    `SELECT vd.id, vd.producto_id, vd.cantidad, vd.precio_unitario, vd.subtotal,
            pr.codigo AS producto_codigo, pr.nombre AS producto_nombre
     FROM venta_detalle vd
     JOIN productos pr ON pr.id = vd.producto_id
     WHERE vd.venta_id = $1
     ORDER BY vd.id`,
    [id]
  );
  venta.detalle = detalle;
  return venta;
};

const findProductosActivos = async () => {
  const { rows } = await pool.query(
    `SELECT id, codigo, nombre, precio_venta, stock
     FROM productos
     WHERE estado = 'Activo'
     ORDER BY nombre ASC`
  );
  return rows;
};

const resolverClienteId = async (client, cedula) => {
  if (!cedula) return null;
  const { rows } = await client.query(
    'SELECT id FROM clientes WHERE cedula = $1 LIMIT 1',
    [cedula]
  );
  return rows[0]?.id ?? null;
};

const buildLineas = async (detalle) => {
  if (!Array.isArray(detalle) || detalle.length === 0) {
    const err = new Error('Agrega al menos un producto a la venta');
    err.status = 400;
    throw err;
  }

  const productoIds = detalle.map((d) => Number(d.producto_id));
  const { rows: productoRows } = await pool.query(
    `SELECT * FROM productos WHERE id = ANY($1::int[]) AND estado = 'Activo'`,
    [productoIds]
  );
  const productosPorId = new Map(productoRows.map((p) => [p.id, p]));

  const lineas = [];
  let total = 0;
  for (const d of detalle) {
    const productoId = Number(d.producto_id);
    const cantidad = Number(d.cantidad);
    const producto = productosPorId.get(productoId);
    if (!producto) {
      const err = new Error('Uno o más productos no son válidos');
      err.status = 400;
      throw err;
    }
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      const err = new Error(`La cantidad de "${producto.nombre}" debe ser mayor a cero`);
      err.status = 400;
      throw err;
    }
    const precioUnitario = d.precio_unitario != null && d.precio_unitario !== ''
      ? Number(d.precio_unitario)
      : Number(producto.precio_venta);
    if (!Number.isFinite(precioUnitario) || precioUnitario < 0) {
      const err = new Error(`El precio de "${producto.nombre}" no es válido`);
      err.status = 400;
      throw err;
    }
    const subtotal = Math.round(cantidad * precioUnitario * 100) / 100;
    total += subtotal;
    lineas.push({
      productoId,
      cantidad,
      precioUnitario,
      subtotal,
      stock: Number(producto.stock),
      nombre: producto.nombre,
    });
  }

  return { lineas, total: Math.round(total * 100) / 100 };
};

const assertStockSuficiente = (lineas) => {
  for (const linea of lineas) {
    if (linea.stock < linea.cantidad) {
      const err = new Error(`Stock insuficiente para "${linea.nombre}" (disponible: ${linea.stock})`);
      err.status = 400;
      throw err;
    }
  }
};

const descontarStock = async (client, lineas) => {
  for (const linea of lineas) {
    const { rowCount } = await client.query(
      `UPDATE productos
       SET stock = stock - $1, updated_at = NOW()
       WHERE id = $2 AND stock >= $1`,
      [linea.cantidad, linea.productoId]
    );
    if (rowCount === 0) {
      const err = new Error(`Stock insuficiente para "${linea.nombre}"`);
      err.status = 400;
      throw err;
    }
  }
};

const restaurarStock = async (client, ventaId) => {
  const { rows: detalleRows } = await client.query(
    'SELECT producto_id, cantidad FROM venta_detalle WHERE venta_id = $1',
    [ventaId]
  );
  for (const d of detalleRows) {
    await client.query(
      `UPDATE productos SET stock = stock + $1, updated_at = NOW() WHERE id = $2`,
      [d.cantidad, d.producto_id]
    );
  }
};

const create = async ({
  origen = 'Recepcion',
  comprador_nombre,
  comprador_apellido,
  comprador_email,
  comprador_telefono = null,
  comprador_cedula = null,
  tipo_entrega = 'RetiroGym',
  direccion_entrega = null,
  ciudad_id = null,
  ciudad_nombre = null,
  sector = null,
  calle = null,
  numero_casa = null,
  referencias = null,
  estado = 'Pendiente',
  metodo_pago = null,
  detalle,
}) => {
  if (!['Publica', 'Recepcion'].includes(origen)) {
    const err = new Error('Origen inválido');
    err.status = 400;
    throw err;
  }
  if (!['RetiroGym', 'Domicilio'].includes(tipo_entrega)) {
    const err = new Error('Tipo de entrega inválido');
    err.status = 400;
    throw err;
  }
  if (!['Pendiente', 'Pagada'].includes(estado)) {
    const err = new Error('Estado inicial inválido');
    err.status = 400;
    throw err;
  }
  if (!comprador_nombre || !comprador_apellido || !comprador_email) {
    const err = new Error('Nombre, apellido y email del comprador son obligatorios');
    err.status = 400;
    throw err;
  }

  let dir = {
    ciudad_id: null,
    ciudad_nombre: null,
    sector: null,
    calle: null,
    numero_casa: null,
    referencias: null,
    direccion_entrega: null,
  };
  if (tipo_entrega === 'Domicilio') {
    dir = await normalizarDireccionDomicilio({
      ciudad_id,
      ciudad_nombre,
      sector,
      calle,
      numero_casa,
      referencias,
      direccion_entrega,
    });
  }

  let metodo = metodo_pago;
  if (estado === 'Pendiente') {
    metodo = 'PendienteRecepcion';
  } else if (!METODOS_PAGO_CONFIRMACION.includes(metodo) && metodo !== 'SimuladoTarjeta') {
    const err = new Error('Selecciona un método de pago válido');
    err.status = 400;
    throw err;
  }

  const { lineas, total } = await buildLineas(detalle);
  if (estado === 'Pagada') {
    assertStockSuficiente(lineas);
  }

  const { rows: seqRows } = await pool.query("SELECT nextval('ventas_id_seq') AS id");
  const id = seqRows[0].id;
  const numeroVenta = 'VEN-' + String(id).padStart(6, '0');
  const token = crypto.randomBytes(32).toString('hex');
  const trackingStatus = tipo_entrega === 'RetiroGym' && estado === 'Pendiente'
    ? 'ListaRetiro'
    : 'Recibida';
  const porcentaje = 0;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const clienteId = await resolverClienteId(client, comprador_cedula);

    await client.query(
      `INSERT INTO ventas (
         id, numero_venta, origen, cliente_id,
         comprador_nombre, comprador_apellido, comprador_email,
         comprador_telefono, comprador_cedula,
         tipo_entrega, direccion_entrega,
         ciudad_id, ciudad_nombre, sector, calle, numero_casa, referencias,
         estado, metodo_pago,
         total, token, tracking_status, porcentaje_entrega
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23
       )`,
      [
        id,
        numeroVenta,
        origen,
        clienteId,
        comprador_nombre.trim(),
        comprador_apellido.trim(),
        comprador_email.trim().toLowerCase(),
        comprador_telefono || null,
        comprador_cedula || null,
        tipo_entrega,
        dir.direccion_entrega,
        dir.ciudad_id,
        dir.ciudad_nombre,
        dir.sector,
        dir.calle,
        dir.numero_casa,
        dir.referencias,
        estado,
        metodo,
        total,
        token,
        trackingStatus,
        porcentaje,
      ]
    );

    for (const linea of lineas) {
      await client.query(
        `INSERT INTO venta_detalle (venta_id, producto_id, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, linea.productoId, linea.cantidad, linea.precioUnitario, linea.subtotal]
      );
    }

    if (estado === 'Pagada') {
      await descontarStock(client, lineas);
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

const marcarPagada = async (id, metodo_pago) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: ventaRows } = await client.query('SELECT * FROM ventas WHERE id = $1 FOR UPDATE', [id]);
    const venta = ventaRows[0];
    if (!venta) {
      await client.query('ROLLBACK');
      return null;
    }
    if (venta.estado !== 'Pendiente') {
      const err = new Error('Solo se puede confirmar el pago de ventas pendientes');
      err.status = 400;
      throw err;
    }

    const { rows: detalleRows } = await client.query(
      `SELECT vd.producto_id, vd.cantidad, pr.nombre, pr.stock
       FROM venta_detalle vd
       JOIN productos pr ON pr.id = vd.producto_id
       WHERE vd.venta_id = $1`,
      [id]
    );
    const lineas = detalleRows.map((d) => ({
      productoId: d.producto_id,
      cantidad: d.cantidad,
      stock: Number(d.stock),
      nombre: d.nombre,
    }));
    assertStockSuficiente(lineas);
    await descontarStock(client, lineas);

    await client.query(
      `UPDATE ventas
       SET estado = 'Pagada', metodo_pago = $1, updated_at = NOW()
       WHERE id = $2`,
      [metodo_pago, id]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return findById(id);
};

const confirmarPago = async (id, { metodo_pago }) => {
  if (!METODOS_PAGO_CONFIRMACION.includes(metodo_pago)) {
    const err = new Error('Método de pago inválido');
    err.status = 400;
    throw err;
  }

  const { rows: peek } = await pool.query('SELECT estado, metodo_pago FROM ventas WHERE id = $1', [id]);
  if (!peek[0]) return null;
  if (peek[0].metodo_pago === 'SimuladoTarjeta' || peek[0].estado === 'Pagada') {
    const err = new Error('Esta venta ya fue pagada por tarjeta simulada en la app. No requiere confirmación en recepción.');
    err.status = 400;
    throw err;
  }
  if (peek[0].estado !== 'Pendiente' || peek[0].metodo_pago !== 'PendienteRecepcion') {
    const err = new Error('Solo se puede confirmar el pago de ventas pendientes de recepción');
    err.status = 400;
    throw err;
  }

  return marcarPagada(id, metodo_pago);
};

/** Marca Pagada con método SimuladoTarjeta (checkout público). */
const pagarSimulado = async (id) => marcarPagada(id, 'SimuladoTarjeta');

const anular = async (id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: ventaRows } = await client.query('SELECT * FROM ventas WHERE id = $1 FOR UPDATE', [id]);
    const venta = ventaRows[0];
    if (!venta) {
      await client.query('ROLLBACK');
      return null;
    }
    if (!['Pendiente'].includes(venta.estado)) {
      const err = new Error(
        venta.estado === 'Anulada'
          ? 'Esta venta ya fue anulada'
          : 'Una venta pagada o entregada no se puede anular'
      );
      err.status = 400;
      throw err;
    }

    await client.query(
      `UPDATE ventas
       SET estado = 'Anulada', updated_at = NOW()
       WHERE id = $1`,
      [id]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return findById(id);
};

const actualizarTracking = async (id, { tracking_status, porcentaje_entrega } = {}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: ventaRows } = await client.query('SELECT * FROM ventas WHERE id = $1 FOR UPDATE', [id]);
    const venta = ventaRows[0];
    if (!venta) {
      await client.query('ROLLBACK');
      return null;
    }
    if (venta.estado === 'Anulada') {
      const err = new Error('No se puede actualizar el tracking de una venta anulada');
      err.status = 400;
      throw err;
    }

    let pct = venta.porcentaje_entrega;
    let status = venta.tracking_status;

    if (porcentaje_entrega != null && porcentaje_entrega !== '') {
      pct = Math.max(0, Math.min(100, Number(porcentaje_entrega)));
      if (!Number.isFinite(pct)) {
        const err = new Error('Porcentaje de entrega inválido');
        err.status = 400;
        throw err;
      }
      status = trackingFromPorcentaje(pct);
    } else if (tracking_status) {
      const valid = ['Recibida', 'EnPreparacion', 'EnCamino', 'ListaRetiro', 'Entregada'];
      if (!valid.includes(tracking_status)) {
        const err = new Error('Estado de tracking inválido');
        err.status = 400;
        throw err;
      }
      status = tracking_status;
      const mapPct = {
        Recibida: 0,
        EnPreparacion: 30,
        EnCamino: 60,
        ListaRetiro: 75,
        Entregada: 100,
      };
      pct = mapPct[status] ?? pct;
    }

    let nuevoEstado = venta.estado;
    if (pct >= 100 && (venta.estado === 'Pagada' || venta.estado === 'Entregada')) {
      nuevoEstado = 'Entregada';
      status = 'Entregada';
      pct = 100;
    }

    await client.query(
      `UPDATE ventas
       SET tracking_status = $1, porcentaje_entrega = $2, estado = $3, updated_at = NOW()
       WHERE id = $4`,
      [status, pct, nuevoEstado, id]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return findById(id);
};

const avanceCamion = async (id, { delta }) => {
  const step = Number(delta);
  if (![15, -15].includes(step)) {
    const err = new Error('El avance del camión debe ser +15 o -15');
    err.status = 400;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: ventaRows } = await client.query('SELECT * FROM ventas WHERE id = $1 FOR UPDATE', [id]);
    const venta = ventaRows[0];
    if (!venta) {
      await client.query('ROLLBACK');
      return null;
    }
    if (venta.estado === 'Anulada') {
      const err = new Error('No se puede avanzar una venta anulada');
      err.status = 400;
      throw err;
    }

    const pct = Math.max(0, Math.min(100, Number(venta.porcentaje_entrega) + step));
    const status = trackingFromPorcentaje(pct);
    let nuevoEstado = venta.estado;
    if (pct >= 100 && (venta.estado === 'Pagada' || venta.estado === 'Entregada')) {
      nuevoEstado = 'Entregada';
    }

    await client.query(
      `UPDATE ventas
       SET porcentaje_entrega = $1, tracking_status = $2, estado = $3, updated_at = NOW()
       WHERE id = $4`,
      [pct, status, nuevoEstado, id]
    );

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
  findProductosActivos,
  create,
  confirmarPago,
  pagarSimulado,
  anular,
  actualizarTracking,
  avanceCamion,
  trackingFromPorcentaje,
  componerDireccion,
  normalizarDireccionDomicilio,
};
