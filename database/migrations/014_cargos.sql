-- Migration: 014_cargos.sql
-- Description: Generación de cargos (Proceso) — cargo pendiente antes del cobro

CREATE TABLE IF NOT EXISTS cargos (
  id                    SERIAL PRIMARY KEY,
  numero_cargo          VARCHAR(20)   NOT NULL UNIQUE,
  cliente_id            INTEGER       NOT NULL REFERENCES clientes(id),
  cliente_membresia_id  INTEGER       REFERENCES cliente_membresias(id),
  concepto              VARCHAR(200)  NOT NULL,
  monto                 NUMERIC(12,2) NOT NULL,
  fecha_generacion      DATE          NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento     DATE          NOT NULL,
  estado                VARCHAR(20)   NOT NULL DEFAULT 'Pendiente',
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_cargos_estado CHECK (estado IN ('Pendiente', 'Pagado', 'Cancelado'))
);

CREATE INDEX IF NOT EXISTS idx_cargos_cliente    ON cargos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cargos_membresia   ON cargos(cliente_membresia_id);
CREATE INDEX IF NOT EXISTS idx_cargos_estado      ON cargos(estado);
CREATE INDEX IF NOT EXISTS idx_cargos_vencimiento ON cargos(fecha_vencimiento);

INSERT INTO permisos (clave, nombre, modulo, descripcion) VALUES
  ('cargos.ver',      'Ver cargos',      'cargos', 'Listar cargos generados'),
  ('cargos.crear',    'Generar cargos',  'cargos', 'Generar un cargo pendiente para un cliente'),
  ('cargos.cancelar', 'Cancelar cargos', 'cargos', 'Cancelar un cargo pendiente')
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  modulo = EXCLUDED.modulo,
  descripcion = EXCLUDED.descripcion;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'Administrador'
  AND p.clave LIKE 'cargos.%'
ON CONFLICT DO NOTHING;
