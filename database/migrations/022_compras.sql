-- Migration: 022_compras.sql
-- Description: Purchases from suppliers — registering a compra increases product stock

CREATE TABLE IF NOT EXISTS compras (
  id            SERIAL PRIMARY KEY,
  numero_compra VARCHAR(20)   NOT NULL UNIQUE,
  proveedor_id  INTEGER       NOT NULL REFERENCES proveedores(id),
  fecha_compra  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  monto_total   NUMERIC(12,2) NOT NULL DEFAULT 0,
  estado        VARCHAR(20)   NOT NULL DEFAULT 'Completada',
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_compras_estado CHECK (estado IN ('Completada', 'Anulada'))
);

CREATE TABLE IF NOT EXISTS compra_detalle (
  id             SERIAL PRIMARY KEY,
  compra_id      INTEGER       NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
  producto_id    INTEGER       NOT NULL REFERENCES productos(id),
  cantidad       INTEGER       NOT NULL CHECK (cantidad > 0),
  costo_unitario NUMERIC(12,2) NOT NULL,
  subtotal       NUMERIC(12,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_compra_detalle_compra ON compra_detalle(compra_id);
CREATE INDEX IF NOT EXISTS idx_compras_proveedor ON compras(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_compras_estado ON compras(estado);

INSERT INTO permisos (clave, nombre, modulo, descripcion) VALUES
  ('compras.ver',     'Ver compras',      'compras', 'Listar compras registradas'),
  ('compras.crear',   'Registrar compras','compras', 'Registrar una nueva compra a proveedor'),
  ('compras.anular',  'Anular compras',   'compras', 'Anular una compra completada')
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  modulo = EXCLUDED.modulo,
  descripcion = EXCLUDED.descripcion;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'Administrador'
  AND p.clave LIKE 'compras.%'
ON CONFLICT DO NOTHING;
