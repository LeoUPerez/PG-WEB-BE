-- Migration: 033_entradas.sql
-- Description: Entrada inmediata de productos (recepción multi-SKU)

CREATE TABLE IF NOT EXISTS entradas (
  id              SERIAL PRIMARY KEY,
  numero_entrada  VARCHAR(20)   NOT NULL UNIQUE,
  proveedor_id    INTEGER       NOT NULL REFERENCES proveedores(id),
  fecha_entrada   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  monto_total     NUMERIC(12,2) NOT NULL DEFAULT 0,
  referencia      VARCHAR(100),
  estado          VARCHAR(20)   NOT NULL DEFAULT 'Completada',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_entradas_estado CHECK (estado IN ('Completada', 'Anulada'))
);

CREATE TABLE IF NOT EXISTS entrada_detalle (
  id             SERIAL PRIMARY KEY,
  entrada_id     INTEGER       NOT NULL REFERENCES entradas(id) ON DELETE CASCADE,
  producto_id    INTEGER       NOT NULL REFERENCES productos(id),
  cantidad       INTEGER       NOT NULL CHECK (cantidad > 0),
  costo_unitario NUMERIC(12,2) NOT NULL,
  subtotal       NUMERIC(12,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_entrada_detalle_entrada ON entrada_detalle(entrada_id);
CREATE INDEX IF NOT EXISTS idx_entradas_proveedor ON entradas(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_entradas_estado ON entradas(estado);
CREATE INDEX IF NOT EXISTS idx_entradas_fecha ON entradas(fecha_entrada);

INSERT INTO permisos (clave, nombre, modulo, descripcion) VALUES
  ('entradas.ver',    'Ver entradas',      'entradas', 'Listar entradas de productos'),
  ('entradas.crear',  'Registrar entradas','entradas', 'Registrar una entrada multi-producto'),
  ('entradas.anular', 'Anular entradas',   'entradas', 'Anular una entrada y revertir stock')
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  modulo = EXCLUDED.modulo,
  descripcion = EXCLUDED.descripcion;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'Administrador'
  AND p.clave LIKE 'entradas.%'
ON CONFLICT DO NOTHING;
