const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// --- Route imports ---
const authRoutes       = require('./routes/auth.routes');
const claseRoutes      = require('./routes/clase.routes');
const rolRoutes        = require('./routes/rol.routes');
const usuarioRoutes    = require('./routes/usuario.routes');
const clienteRoutes    = require('./routes/cliente.routes');
const entrenadorRoutes = require('./routes/entrenador.routes');
const permisoRoutes    = require('./routes/permiso.routes');
const categoriaRoutes  = require('./routes/categoria.routes');
const productoRoutes   = require('./routes/producto.routes');
const proveedorRoutes  = require('./routes/proveedor.routes');
const membresiaRoutes  = require('./routes/membresia.routes');
const horarioRoutes    = require('./routes/horario.routes');
const salonRoutes      = require('./routes/salon.routes');
const clienteMembresiaRoutes = require('./routes/clienteMembresia.routes');
const cargoRoutes = require('./routes/cargo.routes');
const cobroRoutes = require('./routes/cobro.routes');
const publicRoutes = require('./routes/public.routes');
const reservaRoutes = require('./routes/reserva.routes');
const compraRoutes = require('./routes/compra.routes');
const metodoPagoRoutes = require('./routes/metodoPago.routes');

const app = express();

// --- Global middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- API routes ---
app.get('/', (req, res) => {
  res.json({ message: 'ElectroStock API is running' });
});

app.use('/api/auth',         authRoutes);
app.use('/api/clases',      claseRoutes);
app.use('/api/roles',       rolRoutes);
app.use('/api/usuarios',    usuarioRoutes);
app.use('/api/clientes',    clienteRoutes);
app.use('/api/entrenadores', entrenadorRoutes);
app.use('/api/permisos',     permisoRoutes);
app.use('/api/categorias',   categoriaRoutes);
app.use('/api/productos',    productoRoutes);
app.use('/api/proveedores',  proveedorRoutes);
app.use('/api/membresias',   membresiaRoutes);
app.use('/api/horarios-clases', horarioRoutes);
app.use('/api/salones', salonRoutes);
app.use('/api/cliente-membresias', clienteMembresiaRoutes);
app.use('/api/cargos', cargoRoutes);
app.use('/api/cobros', cobroRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/compras', compraRoutes);
app.use('/api/metodos-pago', metodoPagoRoutes);

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
