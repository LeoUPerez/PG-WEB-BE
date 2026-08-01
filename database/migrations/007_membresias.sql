-- Migration: 007_membresias.sql
-- Description: Membership types catalog (Tipos de Membresías)

CREATE TABLE IF NOT EXISTS membresias (
  id             SERIAL PRIMARY KEY,
  nombre         VARCHAR(100)  NOT NULL UNIQUE,
  descripcion    TEXT,
  duracion_dias  INTEGER       NOT NULL,
  precio         NUMERIC(10,2) NOT NULL DEFAULT 0,
  estado         VARCHAR(20)   NOT NULL DEFAULT 'Activo',
  archivado      BOOLEAN       NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_membresias_duracion CHECK (duracion_dias > 0),
  CONSTRAINT chk_membresias_precio CHECK (precio >= 0)
);

CREATE INDEX IF NOT EXISTS idx_membresias_archivado ON membresias(archivado);
CREATE INDEX IF NOT EXISTS idx_membresias_estado ON membresias(estado);

-- Permissions for sidebar / page access
INSERT INTO permisos (clave, nombre, modulo, descripcion) VALUES
  ('membresias.ver',      'Ver membresías',      'membresias', 'Listar tipos de membresía'),
  ('membresias.crear',    'Crear membresías',    'membresias', 'Registrar tipos de membresía'),
  ('membresias.editar',   'Editar membresías',   'membresias', 'Modificar tipos de membresía'),
  ('membresias.archivar', 'Archivar membresías', 'membresias', 'Archivar/restaurar tipos de membresía'),
  ('membresias.eliminar', 'Eliminar membresías', 'membresias', 'Eliminar tipos de membresía')
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  modulo = EXCLUDED.modulo,
  descripcion = EXCLUDED.descripcion;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'Administrador'
  AND p.clave LIKE 'membresias.%'
ON CONFLICT DO NOTHING;
