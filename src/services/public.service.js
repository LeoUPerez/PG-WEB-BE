const crypto = require('crypto');
const pool = require('../config/db');
const emailService = require('./email.service');

const DIA_ORDER = `
  CASE h.dia
    WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miércoles' THEN 3
    WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 WHEN 'Sábado' THEN 6
    WHEN 'Domingo' THEN 7 ELSE 8
  END
`;

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const findClasesDisponibles = async () => {
  const { rows } = await pool.query(
    `SELECT
       h.id AS horario_id,
       h.dia,
       TO_CHAR(h.hora_inicio, 'HH24:MI') AS hora_inicio,
       TO_CHAR(h.hora_fin, 'HH24:MI') AS hora_fin,
       c.id AS clase_id,
       c.nombre,
       c.descripcion,
       c.capacidad,
       LEAST(c.capacidad, COALESCE(s.capacidad, c.capacidad)) AS cupos,
       c.duracion_minutos,
       TRIM(CONCAT(e.nombre, ' ', e.apellido)) AS entrenador_nombre,
       s.nombre AS salon_nombre
     FROM horarios_clases h
     INNER JOIN clases c ON c.id = h.clase_id
     INNER JOIN entrenadores e ON e.id = h.entrenador_id
     INNER JOIN salones s ON s.id = h.salon_id
     WHERE h.archivado = false
       AND h.estado = 'Activo'
       AND c.archivado = false
       AND c.estado = 'Activo'
       AND e.archivado = false
       AND e.estado = 'Activo'
       AND s.archivado = false
       AND s.estado = 'Activo'
     ORDER BY ${DIA_ORDER}, h.hora_inicio ASC`
  );

  return rows;
};

const countReservasActivas = async (horarioId, fechaClase) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM reservas_clases
     WHERE horario_id = $1
       AND fecha_clase = $2
       AND estado IN ('Pendiente', 'Confirmada')`,
    [horarioId, fechaClase]
  );
  return rows[0]?.total ?? 0;
};

const findHorarioActivo = async (horarioId) => {
  const { rows } = await pool.query(
    `SELECT
       h.id AS horario_id,
       h.dia,
       TO_CHAR(h.hora_inicio, 'HH24:MI') AS hora_inicio,
       TO_CHAR(h.hora_fin, 'HH24:MI') AS hora_fin,
       c.id AS clase_id,
       c.nombre,
       c.capacidad,
       LEAST(c.capacidad, COALESCE(s.capacidad, c.capacidad)) AS cupos,
       TRIM(CONCAT(e.nombre, ' ', e.apellido)) AS entrenador_nombre,
       s.nombre AS salon_nombre
     FROM horarios_clases h
     INNER JOIN clases c ON c.id = h.clase_id
     INNER JOIN entrenadores e ON e.id = h.entrenador_id
     INNER JOIN salones s ON s.id = h.salon_id
     WHERE h.id = $1
       AND h.archivado = false
       AND h.estado = 'Activo'
       AND c.archivado = false
       AND c.estado = 'Activo'
       AND e.archivado = false
       AND e.estado = 'Activo'
       AND s.archivado = false
       AND s.estado = 'Activo'`,
    [horarioId]
  );
  return rows[0] || null;
};

const formatearHora12 = (horaHHMM) => {
  const [h, m] = String(horaHHMM || '').split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return horaHHMM || '';
  const periodo = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${periodo}`;
};

const formatearRangoHora = (inicio, fin) => `${formatearHora12(inicio)} – ${formatearHora12(fin)}`;

const formatearFecha = (fechaClase) => {
  const [anio, mes, dia] = String(fechaClase).split('-');
  return `${dia}/${mes}/${anio}`;
};

const fechaCoincideConDia = (fechaClase, dia) => {
  const date = new Date(`${fechaClase}T12:00:00`);
  return DIAS_SEMANA[date.getDay()] === dia;
};

const findClienteByCedula = async (cedula) => {
  const { rows } = await pool.query(
    `SELECT id, nombre, apellido, email, telefono FROM clientes WHERE cedula = $1 AND archivado = false LIMIT 1`,
    [cedula]
  );
  return rows[0] || null;
};

const normalizarTexto = (valor) =>
  String(valor || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();

const createReserva = async ({
  horario_id,
  fecha_clase,
  nombre,
  apellido,
  cedula,
  email,
  telefono,
  notas = null,
}) => {
  const horario = await findHorarioActivo(horario_id);
  if (!horario) {
    const error = new Error('El horario seleccionado no está disponible.');
    error.statusCode = 404;
    throw error;
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(`${fecha_clase}T12:00:00`);
  if (Number.isNaN(fecha.getTime()) || fecha < hoy) {
    const error = new Error('La fecha de la clase debe ser hoy o posterior.');
    error.statusCode = 400;
    throw error;
  }

  if (!fechaCoincideConDia(fecha_clase, horario.dia)) {
    const error = new Error(`La fecha debe corresponder a un ${horario.dia}.`);
    error.statusCode = 400;
    throw error;
  }

  const cliente = await findClienteByCedula(cedula.trim());
  if (!cliente) {
    const error = new Error('Debes estar inscrito como cliente del gimnasio para reservar una clase.');
    error.statusCode = 403;
    throw error;
  }
  if (
    normalizarTexto(cliente.nombre) !== normalizarTexto(nombre) ||
    normalizarTexto(cliente.apellido) !== normalizarTexto(apellido)
  ) {
    const error = new Error('El nombre y apellido no coinciden con el cliente registrado con esta cédula.');
    error.statusCode = 403;
    throw error;
  }
  const clienteId = cliente.id;

  const reservasActivas = await countReservasActivas(horario_id, fecha_clase);
  if (reservasActivas >= horario.cupos) {
    const error = new Error('No hay cupos disponibles para esta clase.');
    error.statusCode = 409;
    throw error;
  }

  const token = crypto.randomBytes(32).toString('hex');

  let rows;
  try {
    ({ rows } = await pool.query(
      `INSERT INTO reservas_clases
         (horario_id, fecha_clase, nombre, apellido, cedula, email, telefono, notas, cliente_id, token)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, horario_id, fecha_clase, nombre, apellido, cedula, email, telefono, notas, estado, created_at`,
      [
        horario_id,
        fecha_clase,
        cliente.nombre,
        cliente.apellido,
        cedula.trim(),
        cliente.email,
        cliente.telefono,
        notas?.trim() || null,
        clienteId,
        token,
      ]
    ));
  } catch (err) {
    if (err.code === '23505' && err.constraint === 'uq_reservas_clases_slot_activa') {
      const error = new Error('Ya tienes una reserva pendiente o confirmada para esta clase en esta fecha.');
      error.statusCode = 409;
      throw error;
    }
    throw err;
  }

  const link = `${(process.env.FRONTEND_URL || '').replace(/\/$/, '')}/confirmar_reserva.php?token=${token}`;
  try {
    await emailService.enviarConfirmacionReserva({
      destinatario: cliente.email,
      nombre: cliente.nombre,
      clase: horario.nombre,
      dia: horario.dia,
      rango: formatearRangoHora(horario.hora_inicio, horario.hora_fin),
      fecha: formatearFecha(fecha_clase),
      entrenador: horario.entrenador_nombre,
      salon: horario.salon_nombre,
      link,
    });
  } catch (err) {
    console.error('No se pudo enviar el correo de confirmación de reserva:', err.message);
  }

  return {
    ...rows[0],
    clase_nombre: horario.nombre,
    dia: horario.dia,
  };
};

const SELECT_RESERVA_TOKEN = `
  SELECT r.id, r.fecha_clase, r.nombre, r.apellido, r.estado, r.token,
         h.dia,
         TO_CHAR(h.hora_inicio, 'HH24:MI') AS hora_inicio,
         TO_CHAR(h.hora_fin, 'HH24:MI') AS hora_fin,
         c.nombre AS clase_nombre,
         TRIM(CONCAT(e.nombre, ' ', e.apellido)) AS entrenador_nombre,
         s.nombre AS salon_nombre
  FROM reservas_clases r
  JOIN horarios_clases h ON h.id = r.horario_id
  JOIN clases c ON c.id = h.clase_id
  JOIN entrenadores e ON e.id = h.entrenador_id
  LEFT JOIN salones s ON s.id = h.salon_id
`;

const findReservaByToken = async (token) => {
  const { rows } = await pool.query(`${SELECT_RESERVA_TOKEN} WHERE r.token = $1`, [token]);
  return rows[0] || null;
};

const confirmarPorToken = async (token) => {
  const { rows: reservaRows } = await pool.query('SELECT * FROM reservas_clases WHERE token = $1', [token]);
  const reserva = reservaRows[0];
  if (!reserva) return null;
  if (reserva.estado !== 'Pendiente') {
    const error = new Error('Esta reserva ya fue procesada.');
    error.statusCode = 400;
    throw error;
  }
  await pool.query("UPDATE reservas_clases SET estado = 'Confirmada', updated_at = NOW() WHERE token = $1", [token]);
  return findReservaByToken(token);
};

const cancelarPorToken = async (token) => {
  const { rows: reservaRows } = await pool.query('SELECT * FROM reservas_clases WHERE token = $1', [token]);
  const reserva = reservaRows[0];
  if (!reserva) return null;
  if (reserva.estado === 'Cancelada') {
    const error = new Error('Esta reserva ya está cancelada.');
    error.statusCode = 400;
    throw error;
  }
  await pool.query("UPDATE reservas_clases SET estado = 'Cancelada', updated_at = NOW() WHERE token = $1", [token]);
  return findReservaByToken(token);
};

const findProductosPublicos = async ({ categoria_id = '' } = {}) => {
  const params = [];
  const conditions = [
    "p.estado = 'Activo'",
    "(c.id IS NULL OR (c.estado = 'Activo' AND c.archivado = false))",
  ];

  if (categoria_id) {
    params.push(Number(categoria_id));
    conditions.push(`p.categoria_id = $${params.length}`);
  }

  const { rows } = await pool.query(
    `SELECT
       p.id,
       p.nombre,
       p.descripcion,
       p.precio_venta,
       p.imagen,
       p.stock,
       (p.stock > 0) AS disponible,
       c.id AS categoria_id,
       c.nombre AS categoria
     FROM productos p
     LEFT JOIN categorias c ON c.id = p.categoria_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY p.nombre ASC`,
    params
  );

  return rows;
};

const toPublicVenta = (venta) => {
  if (!venta) return null;
  return {
    id: venta.id,
    numero_venta: venta.numero_venta,
    token: venta.token,
    estado: venta.estado,
    metodo_pago: venta.metodo_pago,
    tipo_entrega: venta.tipo_entrega,
    direccion_entrega: venta.direccion_entrega,
    ciudad_id: venta.ciudad_id,
    ciudad_nombre: venta.ciudad_nombre,
    sector: venta.sector,
    calle: venta.calle,
    numero_casa: venta.numero_casa,
    referencias: venta.referencias,
    total: venta.total,
    tracking_status: venta.tracking_status,
    porcentaje_entrega: venta.porcentaje_entrega,
    comprador_nombre: venta.comprador_nombre,
    comprador_apellido: venta.comprador_apellido,
    comprador_email: venta.comprador_email,
    created_at: venta.created_at,
    detalle: (venta.detalle || []).map((d) => ({
      producto_id: d.producto_id,
      producto_nombre: d.producto_nombre,
      producto_codigo: d.producto_codigo,
      cantidad: d.cantidad,
      precio_unitario: d.precio_unitario,
      subtotal: d.subtotal,
    })),
  };
};

const findCiudadesEntrega = async () => {
  const { rows } = await pool.query(
    `SELECT id, nombre
     FROM ciudades_entrega
     WHERE activa = true
     ORDER BY orden ASC, nombre ASC`
  );
  return rows;
};

const createSolicitudCobertura = async ({
  ciudad_solicitada,
  email,
  telefono = null,
  nombre = null,
  comentario = null,
}) => {
  const ciudad = String(ciudad_solicitada || '').trim();
  const mail = String(email || '').trim().toLowerCase();
  if (!ciudad || ciudad.length < 2) {
    const error = new Error('Indica la ciudad que quieres solicitar.');
    error.statusCode = 400;
    throw error;
  }
  if (!mail || !mail.includes('@')) {
    const error = new Error('Indica un email válido para avisarte.');
    error.statusCode = 400;
    throw error;
  }

  const { rows } = await pool.query(
    `INSERT INTO solicitudes_cobertura
       (ciudad_solicitada, email, telefono, nombre, comentario)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, ciudad_solicitada, email, estado, created_at`,
    [
      ciudad,
      mail,
      telefono ? String(telefono).trim() : null,
      nombre ? String(nombre).trim() : null,
      comentario ? String(comentario).trim() : null,
    ]
  );
  return rows[0];
};

/** Simulación de tarjeta: solo números de prueba. Nunca persistir PAN/CVV. */
const evaluarTarjetaSimulada = (numeroTarjeta) => {
  const digits = String(numeroTarjeta || '').replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) {
    return {
      aprobada: false,
      mensaje: 'Número de tarjeta inválido. Usa una tarjeta de prueba (ej. 4242 4242 4242 4242).',
    };
  }

  let brand = 'Card';
  if (/^4/.test(digits)) brand = 'Visa';
  else if (/^(5[1-5]|2[2-7])/.test(digits)) brand = 'Mastercard';
  else if (/^3[47]/.test(digits)) brand = 'Amex';

  const last4 = digits.slice(-4);
  // Rechazo fijo (estilo Stripe test)
  if (digits === '4000000000000002') {
    return {
      aprobada: false,
      brand,
      last4,
      mensaje: 'Pago rechazado por el banco (tarjeta de prueba de rechazo).',
    };
  }
  // Éxito: Visa de prueba 4242… u otras que no estén en lista de rechazo
  if (digits === '4242424242424242' || digits.startsWith('4242')) {
    return { aprobada: true, brand, last4 };
  }
  // Otras marcas de prueba comunes
  if (digits === '5555555555554444' || digits === '378282246310005') {
    return { aprobada: true, brand, last4 };
  }

  return {
    aprobada: false,
    brand,
    last4,
    mensaje: 'Usa una tarjeta de prueba: 4242 4242 4242 4242 (éxito) o 4000 0000 0000 0002 (rechazo).',
  };
};

const createVentaPublica = async (payload) => {
  const ventaService = require('./venta.service');

  const tipo_entrega = payload.tipo_entrega || 'RetiroGym';
  const canal_pago = payload.canal_pago || 'recepcion';

  if (!['RetiroGym', 'Domicilio'].includes(tipo_entrega)) {
    const error = new Error('Tipo de entrega inválido.');
    error.statusCode = 400;
    throw error;
  }
  if (!payload.comprador_nombre || !payload.comprador_apellido || !payload.comprador_email) {
    const error = new Error('Nombre, apellido y email son obligatorios.');
    error.statusCode = 400;
    throw error;
  }
  if (!Array.isArray(payload.detalle) || payload.detalle.length === 0) {
    const error = new Error('Agrega al menos un producto al carrito.');
    error.statusCode = 400;
    throw error;
  }
  if (!['recepcion', 'tarjeta'].includes(canal_pago)) {
    const error = new Error('Canal de pago inválido.');
    error.statusCode = 400;
    throw error;
  }

  let pagoSim = null;
  if (canal_pago === 'tarjeta') {
    pagoSim = evaluarTarjetaSimulada(payload.tarjeta_numero);
    if (!pagoSim.aprobada) {
      const error = new Error(pagoSim.mensaje || 'Pago rechazado.');
      error.statusCode = 402;
      throw error;
    }
  }

  let venta;
  try {
    venta = await ventaService.create({
      origen: 'Publica',
      comprador_nombre: payload.comprador_nombre,
      comprador_apellido: payload.comprador_apellido,
      comprador_email: payload.comprador_email,
      comprador_telefono: payload.comprador_telefono || null,
      comprador_cedula: null,
      tipo_entrega,
      ciudad_id: payload.ciudad_id,
      sector: payload.sector,
      calle: payload.calle,
      numero_casa: payload.numero_casa,
      referencias: payload.referencias,
      estado: canal_pago === 'tarjeta' ? 'Pagada' : 'Pendiente',
      metodo_pago: canal_pago === 'tarjeta' ? 'SimuladoTarjeta' : 'PendienteRecepcion',
      detalle: payload.detalle,
    });
  } catch (err) {
    if (err.status && !err.statusCode) err.statusCode = err.status;
    throw err;
  }

  const linkBase = (process.env.FRONTEND_URL || 'http://localhost:8080').replace(/\/$/, '');
  const link = `${linkBase}/tracking_venta.php?q=${encodeURIComponent(venta.numero_venta)}`;
  const tipoLabel = tipo_entrega === 'Domicilio'
    ? `Domicilio · ${venta.ciudad_nombre || ''}`.trim()
    : 'Retiro en gym';
  const pagada = canal_pago === 'tarjeta';
  const estadoEmail = pagada
    ? 'Pagada (tarjeta simulada)'
    : 'Pendiente de pago en recepción';

  let emailEnviado = false;
  try {
    await emailService.enviarConfirmacionVenta({
      destinatario: venta.comprador_email,
      nombre: venta.comprador_nombre,
      numero_venta: venta.numero_venta,
      total: venta.total,
      tipo_entrega: tipoLabel,
      estado: estadoEmail,
      link,
      pagada,
    });
    emailEnviado = true;
  } catch (err) {
    const detail = err?.response?.body || err.message;
    console.error('No se pudo enviar el correo de tracking de venta:', detail);
  }

  return {
    ...toPublicVenta(venta),
    tracking_url: link,
    email_enviado: emailEnviado,
    pago: pagoSim
      ? { resultado: 'aprobado', brand: pagoSim.brand, last4: pagoSim.last4 }
      : { resultado: 'pendiente_recepcion' },
  };
};

const pagarVentaSimulada = async (token, payload = {}) => {
  const ventaService = require('./venta.service');
  const codigo = String(token || '').trim();
  if (!codigo) {
    const error = new Error('Token de venta requerido.');
    error.statusCode = 400;
    throw error;
  }

  const pagoSim = evaluarTarjetaSimulada(payload.tarjeta_numero);
  if (!pagoSim.aprobada) {
    const error = new Error(pagoSim.mensaje || 'Pago rechazado.');
    error.statusCode = 402;
    throw error;
  }

  const { rows } = await pool.query(
    `SELECT id, estado FROM ventas WHERE token = $1 LIMIT 1`,
    [codigo]
  );
  if (!rows[0]) {
    const error = new Error('Pedido no encontrado.');
    error.statusCode = 404;
    throw error;
  }
  if (rows[0].estado !== 'Pendiente') {
    const error = new Error('Este pedido ya no está pendiente de pago.');
    error.statusCode = 400;
    throw error;
  }

  let venta;
  try {
    venta = await ventaService.pagarSimulado(rows[0].id);
  } catch (err) {
    if (err.status && !err.statusCode) err.statusCode = err.status;
    throw err;
  }

  return {
    ...toPublicVenta(venta),
    pago: { resultado: 'aprobado', brand: pagoSim.brand, last4: pagoSim.last4 },
  };
};

const findVentaTracking = async (q) => {
  const ventaService = require('./venta.service');
  const codigo = String(q || '').trim();
  if (!codigo) return null;

  const { rows } = await pool.query(
    `SELECT id FROM ventas
     WHERE numero_venta = $1 OR token = $1
     LIMIT 1`,
    [codigo]
  );
  if (!rows[0]) return null;

  const venta = await ventaService.findById(rows[0].id);
  return toPublicVenta(venta);
};

module.exports = {
  findClasesDisponibles,
  findProductosPublicos,
  findCiudadesEntrega,
  createSolicitudCobertura,
  createVentaPublica,
  pagarVentaSimulada,
  findVentaTracking,
  createReserva,
  findReservaByToken,
  confirmarPorToken,
  cancelarPorToken,
};
