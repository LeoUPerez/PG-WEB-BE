-- Migration: 016_renovaciones_permisos.sql
-- Description: Renovación de membresía (Proceso) — reutiliza la tabla cliente_membresias

INSERT INTO permisos (clave, nombre, modulo, descripcion) VALUES
  ('renovaciones.ver',   'Ver renovaciones de membresía', 'renovaciones', 'Ver el estado de membresías de los clientes y renovarlas'),
  ('renovaciones.crear', 'Renovar membresía',             'renovaciones', 'Registrar la renovación de una membresía')
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  modulo = EXCLUDED.modulo,
  descripcion = EXCLUDED.descripcion;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'Administrador'
  AND p.clave LIKE 'renovaciones.%'
ON CONFLICT DO NOTHING;
