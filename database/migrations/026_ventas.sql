-- Migration: 026_ventas.sql
-- Description: Customer sales (separate from membership cobros). Stock OUT on Pagada.

CREATE TABLE IF NOT EXISTS ventas (
  id                   SERIAL PRIMARY KEY,
  numero_venta         VARCHAR(20)   NOT NULL UNIQUE,
  origen               VARCHAR(20)   NOT NULL DEFAULT 'Recepcion',
  cliente_id           INTEGER       REFERENCES clientes(id) ON DELETE SET NULL,
  comprador_nombre     VARCHAR(100)  NOT NULL,
  comprador_apellido   VARCHAR(100)  NOT NULL,
  comprador_email      VARCHAR(150)  NOT NULL,
  comprador_telefono   VARCHAR(30),
  comprador_cedula     VARCHAR(20),
  tipo_entrega         VARCHAR(20)   NOT NULL DEFAULT 'RetiroGym',
  direccion_entrega    TEXT,
  estado               VARCHAR(20)   NOT NULL DEFAULT 'Pendiente',
  metodo_pago          VARCHAR(30)   NOT NULL DEFAULT 'PendienteRecepcion',
  total                NUMERIC(12,2) NOT NULL DEFAULT 0,
  token                VARCHAR(64)   NOT NULL UNIQUE,
  tracking_status      VARCHAR(30)   NOT NULL DEFAULT 'Recibida',
  porcentaje_entrega   INTEGER       NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_ventas_origen CHECK (origen IN ('Publica', 'Recepcion')),
  CONSTRAINT chk_ventas_tipo_entrega CHECK (tipo_entrega IN ('RetiroGym', 'Domicilio')),
  CONSTRAINT chk_ventas_estado CHECK (estado IN ('Pendiente', 'Pagada', 'Anulada', 'Entregada')),
  CONSTRAINT chk_ventas_metodo_pago CHECK (metodo_pago IN (
    'SimuladoTarjeta', 'Efectivo', 'Tarjeta', 'Transferencia', 'PendienteRecepcion'
  )),
  CONSTRAINT chk_ventas_tracking CHECK (tracking_status IN (
    'Recibida', 'EnPreparacion', 'EnCamino', 'ListaRetiro', 'Entregada'
  )),
  CONSTRAINT chk_ventas_porcentaje CHECK (porcentaje_entrega >= 0 AND porcentaje_entrega <= 100)
);

CREATE TABLE IF NOT EXISTS venta_detalle (
  id              SERIAL PRIMARY KEY,
  venta_id        INTEGER       NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id     INTEGER       NOT NULL REFERENCES productos(id),
  cantidad        INTEGER       NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(12,2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal        NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_venta_detalle_venta ON venta_detalle(venta_id);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_estado ON ventas(estado);
CREATE INDEX IF NOT EXISTS idx_ventas_token ON ventas(token);
CREATE INDEX IF NOT EXISTS idx_ventas_numero ON ventas(numero_venta);
CREATE INDEX IF NOT EXISTS idx_ventas_email ON ventas(comprador_email);

INSERT INTO permisos (clave, nombre, modulo, descripcion) VALUES
  ('ventas.ver',                 'Ver ventas',              'ventas', 'Listar ventas registradas'),
  ('ventas.crear',               'Registrar ventas',        'ventas', 'Registrar una venta en recepción'),
  ('ventas.confirmar',           'Confirmar pago de venta', 'ventas', 'Confirmar pago de una venta pendiente'),
  ('ventas.anular',              'Anular ventas',           'ventas', 'Anular una venta y revertir stock si aplica'),
  ('ventas.actualizar_tracking', 'Actualizar tracking',     'ventas', 'Actualizar estado y porcentaje de entrega')
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  modulo = EXCLUDED.modulo,
  descripcion = EXCLUDED.descripcion;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'Administrador'
  AND p.clave LIKE 'ventas.%'
ON CONFLICT DO NOTHING;
