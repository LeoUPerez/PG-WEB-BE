-- Migration: 013_cliente_membresias.sql
-- Description: Asignación de membresías a clientes (Proceso)

CREATE TABLE IF NOT EXISTS cliente_membresias (
  id                 SERIAL PRIMARY KEY,
  cliente_id         INTEGER       NOT NULL REFERENCES clientes(id),
  membresia_id       INTEGER       NOT NULL REFERENCES membresias(id),
  fecha_inicio       DATE          NOT NULL,
  fecha_vencimiento  DATE          NOT NULL,
  precio             NUMERIC(12,2) NOT NULL,
  estado             VARCHAR(20)   NOT NULL DEFAULT 'Activa',
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_cliente_membresias_fechas CHECK (fecha_vencimiento > fecha_inicio),
  CONSTRAINT chk_cliente_membresias_estado CHECK (estado IN ('Activa', 'Cancelada'))
);

CREATE INDEX IF NOT EXISTS idx_cliente_membresias_cliente   ON cliente_membresias(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_membresias_membresia ON cliente_membresias(membresia_id);
CREATE INDEX IF NOT EXISTS idx_cliente_membresias_estado    ON cliente_membresias(estado);
CREATE INDEX IF NOT EXISTS idx_cliente_membresias_vencimiento ON cliente_membresias(fecha_vencimiento);

INSERT INTO permisos (clave, nombre, modulo, descripcion) VALUES
  ('asignaciones.ver',     'Ver asignaciones de membresía',     'asignaciones', 'Listar asignaciones de membresía a clientes'),
  ('asignaciones.crear',   'Asignar membresía',                 'asignaciones', 'Asignar un plan de membresía a un cliente'),
  ('asignaciones.cancelar','Cancelar asignación de membresía',  'asignaciones', 'Cancelar una membresía asignada')
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  modulo = EXCLUDED.modulo,
  descripcion = EXCLUDED.descripcion;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'Administrador'
  AND p.clave LIKE 'asignaciones.%'
ON CONFLICT DO NOTHING;
