-- Seed demo: dashboard — clases de hoy, cargos vencidos, membresías por vencer
-- Uso:
--   cat database/seeds/seed_dashboard_demo.sql | docker exec -i proyecto_paginas_web_db \
--     psql -U postgres -d proyecto_paginas_web

BEGIN;

-- ── Clientes demo ────────────────────────────────────────────────────────────
INSERT INTO clientes (nombre, apellido, cedula, email, telefono, sexo, estado, archivado)
VALUES
  ('Elena',   'Castillo',  '402-9102001-1', 'elena.castillo.demo@urod.test',  '8095552001', 'F', 'Activo', false),
  ('Ricardo', 'Mejía',     '402-9102002-1', 'ricardo.mejia.demo@urod.test',   '8095552002', 'M', 'Activo', false),
  ('Valeria', 'Núñez',     '402-9102003-1', 'valeria.nunez.demo@urod.test',   '8095552003', 'F', 'Activo', false),
  ('Andrés',  'Rojas',     '402-9102004-1', 'andres.rojas.demo@urod.test',    '8095552004', 'M', 'Activo', false),
  ('Camila',  'Herrera',   '402-9102005-1', 'camila.herrera.demo@urod.test',  '8095552005', 'F', 'Activo', false),
  ('Diego',   'Morales',   '402-9102006-1', 'diego.morales.demo@urod.test',   '8095552006', 'M', 'Activo', false)
ON CONFLICT (cedula) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  apellido = EXCLUDED.apellido,
  email = EXCLUDED.email,
  telefono = EXCLUDED.telefono,
  estado = 'Activo',
  archivado = false,
  updated_at = NOW();

-- ── Membresía plan (si no hay ninguna activa) ────────────────────────────────
INSERT INTO membresias (nombre, descripcion, duracion_dias, precio, estado, destacado, archivado)
SELECT
  'Plan Demo Dashboard',
  'Plan usado para datos de demostración del dashboard.',
  30,
  1500.00,
  'Activo',
  false,
  false
WHERE NOT EXISTS (
  SELECT 1 FROM membresias WHERE archivado = false AND estado = 'Activo'
);

-- Si ya existe beneficios (migración 032), rellena demo si está vacío
UPDATE membresias
SET beneficios = '["Acceso a sala","Clases grupales"]'::jsonb
WHERE nombre = 'Plan Demo Dashboard'
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'membresias' AND column_name = 'beneficios'
  )
  AND (beneficios IS NULL OR beneficios = '[]'::jsonb);

-- ── Entrenador demo ──────────────────────────────────────────────────────────
INSERT INTO entrenadores (nombre, apellido, cedula, email, telefono, especialidad, estado, archivado)
VALUES (
  'Luis', 'Demo', '402-9103001-1', 'luis.demo.entrenador@urod.test', '8095553001',
  'Funcional', 'Activo', false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  apellido = EXCLUDED.apellido,
  email = EXCLUDED.email,
  telefono = EXCLUDED.telefono,
  estado = 'Activo',
  archivado = false,
  updated_at = NOW();

-- ── Clases demo ──────────────────────────────────────────────────────────────
INSERT INTO clases (nombre, descripcion, capacidad, duracion_minutos, estado, archivado)
VALUES
  ('Spinning Demo',  'Clase de ciclismo indoor para el dashboard.', 20, 45, 'Activo', false),
  ('HIIT Demo',      'Entrenamiento de alta intensidad.',           16, 40, 'Activo', false),
  ('Yoga Demo',      'Sesión de yoga suave.',                       18, 60, 'Activo', false)
ON CONFLICT (nombre) DO UPDATE SET
  estado = 'Activo',
  archivado = false,
  updated_at = NOW();

-- ── Horarios de HOY (día actual en español) ──────────────────────────────────
-- Dashboard filtra horarios_clases.dia == nombre del día (Martes, Miércoles, …)
DO $$
DECLARE
  v_dia TEXT;
  v_entrenador_id INTEGER;
  v_clase_spin INTEGER;
  v_clase_hiit INTEGER;
  v_clase_yoga INTEGER;
BEGIN
  v_dia := CASE EXTRACT(DOW FROM CURRENT_DATE)::int
    WHEN 0 THEN 'Domingo'
    WHEN 1 THEN 'Lunes'
    WHEN 2 THEN 'Martes'
    WHEN 3 THEN 'Miércoles'
    WHEN 4 THEN 'Jueves'
    WHEN 5 THEN 'Viernes'
    ELSE 'Sábado'
  END;

  SELECT id INTO v_entrenador_id FROM entrenadores WHERE cedula = '402-9103001-1';
  SELECT id INTO v_clase_spin FROM clases WHERE nombre = 'Spinning Demo';
  SELECT id INTO v_clase_hiit FROM clases WHERE nombre = 'HIIT Demo';
  SELECT id INTO v_clase_yoga FROM clases WHERE nombre = 'Yoga Demo';

  -- Limpia horarios demo previos del mismo día para re-sembrar limpio
  DELETE FROM horarios_clases
  WHERE entrenador_id = v_entrenador_id
    AND clase_id IN (v_clase_spin, v_clase_hiit, v_clase_yoga)
    AND dia = v_dia;

  INSERT INTO horarios_clases (clase_id, entrenador_id, dia, hora_inicio, hora_fin, estado, archivado)
  VALUES
    (v_clase_spin, v_entrenador_id, v_dia, TIME '07:00', TIME '07:45', 'Activo', false),
    (v_clase_hiit, v_entrenador_id, v_dia, TIME '10:30', TIME '11:10', 'Activo', false),
    (v_clase_yoga, v_entrenador_id, v_dia, TIME '18:00', TIME '19:00', 'Activo', false);
END $$;

-- ── Membresías por vencer / recientemente vencidas ───────────────────────────
-- Cancela asignaciones activas previas de estos clientes demo
UPDATE cliente_membresias cm
SET estado = 'Cancelada', updated_at = NOW()
FROM clientes c
WHERE cm.cliente_id = c.id
  AND cm.estado = 'Activa'
  AND c.cedula IN (
    '402-9102001-1','402-9102002-1','402-9102003-1',
    '402-9102004-1','402-9102005-1','402-9102006-1'
  );

INSERT INTO cliente_membresias (cliente_id, membresia_id, fecha_inicio, fecha_vencimiento, precio, estado)
SELECT
  c.id,
  m.id,
  v.fecha_inicio,
  v.fecha_vencimiento,
  m.precio,
  'Activa'
FROM (VALUES
  ('402-9102001-1', CURRENT_DATE - 28, CURRENT_DATE + 2),  -- por vencer en 2 días
  ('402-9102002-1', CURRENT_DATE - 25, CURRENT_DATE + 4),  -- por vencer en 4 días
  ('402-9102003-1', CURRENT_DATE - 27, CURRENT_DATE + 6),  -- por vencer en 6 días
  ('402-9102004-1', CURRENT_DATE - 40, CURRENT_DATE - 3),  -- ya vencida (aparece en panel)
  ('402-9102005-1', CURRENT_DATE - 35, CURRENT_DATE + 1),  -- por vencer mañana
  ('402-9102006-1', CURRENT_DATE - 20, CURRENT_DATE + 5)   -- por vencer en 5 días
) AS v(cedula, fecha_inicio, fecha_vencimiento)
JOIN clientes c ON c.cedula = v.cedula
JOIN LATERAL (
  SELECT id, precio
  FROM membresias
  WHERE archivado = false AND estado = 'Activo'
  ORDER BY id
  LIMIT 1
) m ON TRUE
WHERE NOT EXISTS (
  SELECT 1
  FROM cliente_membresias cm
  WHERE cm.cliente_id = c.id
    AND cm.estado = 'Activa'
    AND cm.fecha_vencimiento = v.fecha_vencimiento
);

-- ── Cargos vencidos (Pendiente + fecha_vencimiento < hoy) ────────────────────
INSERT INTO cargos (
  numero_cargo, cliente_id, cliente_membresia_id, concepto, monto,
  fecha_generacion, fecha_vencimiento, estado
)
SELECT
  'CARG-DEMO-' || RIGHT(c.cedula, 4),
  c.id,
  cm.id,
  'Membresía ' || COALESCE(m.nombre, 'Plan'),
  COALESCE(cm.precio, m.precio, 1500),
  v.fecha_gen,
  v.fecha_venc,
  'Pendiente'
FROM (VALUES
  ('402-9102001-1', CURRENT_DATE - 20, CURRENT_DATE - 8),
  ('402-9102002-1', CURRENT_DATE - 15, CURRENT_DATE - 5),
  ('402-9102003-1', CURRENT_DATE - 12, CURRENT_DATE - 2),
  ('402-9102004-1', CURRENT_DATE - 25, CURRENT_DATE - 12)
) AS v(cedula, fecha_gen, fecha_venc)
JOIN clientes c ON c.cedula = v.cedula
JOIN LATERAL (
  SELECT cm2.id, cm2.precio, cm2.membresia_id
  FROM cliente_membresias cm2
  WHERE cm2.cliente_id = c.id
  ORDER BY cm2.created_at DESC, cm2.id DESC
  LIMIT 1
) cm ON TRUE
JOIN membresias m ON m.id = cm.membresia_id
WHERE NOT EXISTS (
  SELECT 1 FROM cargos ca WHERE ca.numero_cargo = 'CARG-DEMO-' || RIGHT(c.cedula, 4)
);

COMMIT;
