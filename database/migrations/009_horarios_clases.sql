-- Migration: 009_horarios_clases.sql
-- Description: Weekly class schedules (Horario de Clases) + permissions

CREATE TABLE IF NOT EXISTS horarios_clases (
  id              SERIAL PRIMARY KEY,
  clase_id        INTEGER       NOT NULL REFERENCES clases(id),
  entrenador_id   INTEGER       NOT NULL REFERENCES entrenadores(id),
  dia             VARCHAR(20)   NOT NULL,
  hora_inicio     TIME          NOT NULL,
  hora_fin        TIME          NOT NULL,
  estado          VARCHAR(20)   NOT NULL DEFAULT 'Activo',
  archivado       BOOLEAN       NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_horarios_clases_dia CHECK (
    dia IN ('Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo')
  ),
  CONSTRAINT chk_horarios_clases_horas CHECK (hora_fin > hora_inicio),
  CONSTRAINT chk_horarios_clases_estado CHECK (estado IN ('Activo', 'Inactivo'))
);

CREATE INDEX IF NOT EXISTS idx_horarios_clases_archivado ON horarios_clases(archivado);
CREATE INDEX IF NOT EXISTS idx_horarios_clases_estado ON horarios_clases(estado);
CREATE INDEX IF NOT EXISTS idx_horarios_clases_dia ON horarios_clases(dia);
CREATE INDEX IF NOT EXISTS idx_horarios_clases_clase ON horarios_clases(clase_id);
CREATE INDEX IF NOT EXISTS idx_horarios_clases_entrenador ON horarios_clases(entrenador_id);

INSERT INTO permisos (clave, nombre, modulo, descripcion) VALUES
  ('horarios.ver',      'Ver horarios',      'horarios', 'Listar horarios de clases'),
  ('horarios.crear',    'Crear horarios',    'horarios', 'Registrar horarios de clases'),
  ('horarios.editar',   'Editar horarios',   'horarios', 'Modificar horarios de clases'),
  ('horarios.archivar', 'Archivar horarios', 'horarios', 'Archivar/restaurar horarios de clases')
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  modulo = EXCLUDED.modulo,
  descripcion = EXCLUDED.descripcion;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'Administrador'
  AND p.clave LIKE 'horarios.%'
ON CONFLICT DO NOTHING;
