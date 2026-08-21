-- Migration: 019_salones.sql
-- Description: Gym rooms (salones) + salon_id on class schedules

CREATE TABLE IF NOT EXISTS salones (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(150) NOT NULL UNIQUE,
  capacidad   INTEGER      NOT NULL CHECK (capacidad > 0),
  descripcion TEXT,
  estado      VARCHAR(20)  NOT NULL DEFAULT 'Activo',
  archivado   BOOLEAN      NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_salones_estado CHECK (estado IN ('Activo', 'Inactivo'))
);

CREATE INDEX IF NOT EXISTS idx_salones_archivado ON salones(archivado);
CREATE INDEX IF NOT EXISTS idx_salones_estado ON salones(estado);

ALTER TABLE horarios_clases
  ADD COLUMN IF NOT EXISTS salon_id INTEGER REFERENCES salones(id);

CREATE INDEX IF NOT EXISTS idx_horarios_clases_salon ON horarios_clases(salon_id);

INSERT INTO permisos (clave, nombre, modulo, descripcion) VALUES
  ('salones.ver',      'Ver salones',      'salones', 'Listar salones'),
  ('salones.crear',    'Crear salones',    'salones', 'Registrar salones'),
  ('salones.editar',   'Editar salones',   'salones', 'Modificar salones'),
  ('salones.archivar', 'Archivar salones', 'salones', 'Archivar/restaurar salones')
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  modulo = EXCLUDED.modulo,
  descripcion = EXCLUDED.descripcion;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'Administrador'
  AND p.clave LIKE 'salones.%'
ON CONFLICT DO NOTHING;
