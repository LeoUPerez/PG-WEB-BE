-- Migration: 017_cobros_anular_permiso.sql
-- Description: Permiso para anular un cobro registrado (revierte sus cargos a Pendiente)

INSERT INTO permisos (clave, nombre, modulo, descripcion) VALUES
  ('cobros.anular', 'Anular cobro', 'cobros', 'Anular un cobro registrado y revertir sus cargos a pendiente')
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  modulo = EXCLUDED.modulo,
  descripcion = EXCLUDED.descripcion;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'Administrador'
  AND p.clave = 'cobros.anular'
ON CONFLICT DO NOTHING;
