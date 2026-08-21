-- Migration: 018_reservas_clases.sql
-- Description: Public class reservations from landing page

CREATE TABLE IF NOT EXISTS reservas_clases (
  id          SERIAL PRIMARY KEY,
  horario_id  INTEGER       NOT NULL REFERENCES horarios_clases(id),
  fecha_clase DATE          NOT NULL,
  nombre      VARCHAR(100)  NOT NULL,
  apellido    VARCHAR(100)  NOT NULL,
  cedula      VARCHAR(20)   NOT NULL,
  email       VARCHAR(150)  NOT NULL,
  telefono    VARCHAR(20)   NOT NULL,
  notas       TEXT,
  estado      VARCHAR(20)   NOT NULL DEFAULT 'Pendiente',
  cliente_id  INTEGER       REFERENCES clientes(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_reservas_clases_slot UNIQUE (horario_id, fecha_clase, cedula),
  CONSTRAINT chk_reservas_clases_estado CHECK (estado IN ('Pendiente', 'Confirmada', 'Cancelada'))
);

CREATE INDEX IF NOT EXISTS idx_reservas_clases_horario_fecha ON reservas_clases(horario_id, fecha_clase);
CREATE INDEX IF NOT EXISTS idx_reservas_clases_estado ON reservas_clases(estado);
CREATE INDEX IF NOT EXISTS idx_reservas_clases_fecha ON reservas_clases(fecha_clase);

INSERT INTO permisos (clave, nombre, modulo, descripcion) VALUES
  ('reservas.ver',      'Ver reservas',      'reservas', 'Listar reservas de clases'),
  ('reservas.gestionar','Gestionar reservas','reservas', 'Confirmar o cancelar reservas')
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  modulo = EXCLUDED.modulo,
  descripcion = EXCLUDED.descripcion;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'Administrador'
  AND p.clave LIKE 'reservas.%'
ON CONFLICT DO NOTHING;
