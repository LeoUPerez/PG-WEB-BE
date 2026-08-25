-- Seed demo: clientes + reservas Yoga (varios estados)
-- Uso:
--   cat database/seeds/seed_reservas_yoga_demo.sql | docker exec -i proyecto_paginas_web_db \
--     psql -U postgres -d proyecto_paginas_web

BEGIN;

INSERT INTO clientes (nombre, apellido, cedula, email, telefono, sexo, estado, archivado)
VALUES
  ('María',   'González',  '402-9001001-1', 'maria.gonzalez.demo@urod.test',   '8095551001', 'F', 'Activo', false),
  ('Carlos',  'Ramírez',   '402-9001002-1', 'carlos.ramirez.demo@urod.test',   '8095551002', 'M', 'Activo', false),
  ('Ana',     'Pérez',     '402-9001003-1', 'ana.perez.demo@urod.test',        '8095551003', 'F', 'Activo', false),
  ('José',    'Martínez',  '402-9001004-1', 'jose.martinez.demo@urod.test',    '8095551004', 'M', 'Activo', false),
  ('Laura',   'Santos',    '402-9001005-1', 'laura.santos.demo@urod.test',     '8095551005', 'F', 'Activo', false),
  ('Pedro',   'Jiménez',   '402-9001006-1', 'pedro.jimenez.demo@urod.test',    '8095551006', 'M', 'Activo', false),
  ('Sofía',   'Vargas',    '402-9001007-1', 'sofia.vargas.demo@urod.test',     '8095551007', 'F', 'Activo', false),
  ('Miguel',  'Torres',    '402-9001008-1', 'miguel.torres.demo@urod.test',    '8095551008', 'M', 'Activo', false)
ON CONFLICT (cedula) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  apellido = EXCLUDED.apellido,
  email = EXCLUDED.email,
  telefono = EXCLUDED.telefono,
  updated_at = NOW();

INSERT INTO reservas_clases (
  horario_id, fecha_clase, nombre, apellido, cedula, email, telefono,
  notas, estado, cliente_id, token
)
SELECT
  h.id,
  DATE '2026-08-26',
  cl.nombre,
  cl.apellido,
  cl.cedula,
  cl.email,
  cl.telefono,
  v.notas,
  v.estado,
  cl.id,
  md5(cl.cedula || v.estado || random()::text)
FROM (VALUES
  ('402-9001001-1', 'Pendiente',  'Quiere primera sesión'::text),
  ('402-9001002-1', 'Pendiente',  'Prefiere cerca de la ventana'),
  ('402-9001003-1', 'Pendiente',  NULL),
  ('402-9001004-1', 'Confirmada', 'Asiste con tapete propio'),
  ('402-9001005-1', 'Confirmada', NULL),
  ('402-9001006-1', 'Confirmada', 'Cliente frecuente'),
  ('402-9001007-1', 'Cancelada',  'No podrá asistir'),
  ('402-9001008-1', 'Cancelada',  'Cambio de horario')
) AS v(cedula, estado, notas)
JOIN clientes cl ON cl.cedula = v.cedula
JOIN horarios_clases h ON h.id = (
  SELECT h2.id
  FROM horarios_clases h2
  JOIN clases c ON c.id = h2.clase_id
  WHERE c.nombre ILIKE 'Yoga'
    AND h2.dia = 'Miércoles'
    AND h2.hora_inicio = TIME '08:00'
    AND COALESCE(h2.archivado, false) = false
  ORDER BY h2.id
  LIMIT 1
)
WHERE NOT EXISTS (
  SELECT 1
  FROM reservas_clases r
  WHERE r.horario_id = h.id
    AND r.fecha_clase = DATE '2026-08-26'
    AND r.cedula = v.cedula
);

COMMIT;
