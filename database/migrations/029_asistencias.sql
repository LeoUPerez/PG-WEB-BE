-- Migration: 029_asistencias.sql
-- Description: Check-in general de entrada/salida al gimnasio

CREATE TABLE IF NOT EXISTS asistencias (
  id                    SERIAL PRIMARY KEY,
  cliente_id            INTEGER NOT NULL,
  cliente_membresia_id  INTEGER,
  fecha                 DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_entrada          TIME NOT NULL DEFAULT CURRENT_TIME,
  hora_salida           TIME,
  created_by            INTEGER,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_asistencias_cliente
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_asistencias_membresia
    FOREIGN KEY (cliente_membresia_id) REFERENCES cliente_membresias(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_asistencias_created_by
    FOREIGN KEY (created_by) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_asistencias_cliente_id ON asistencias(cliente_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON asistencias(fecha);

INSERT INTO permisos (clave, nombre, modulo, descripcion) VALUES
  ('asistencias.ver',        'Ver asistencias',        'asistencias', 'Consultar historial de asistencias'),
  ('asistencias.registrar',  'Registrar asistencias',  'asistencias', 'Marcar entrada y salida de clientes')
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  modulo = EXCLUDED.modulo,
  descripcion = EXCLUDED.descripcion;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'Administrador'
  AND p.clave IN ('asistencias.ver', 'asistencias.registrar')
ON CONFLICT DO NOTHING;
