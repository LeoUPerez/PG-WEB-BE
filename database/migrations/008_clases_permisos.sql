-- Migration: 008_clases_permisos.sql
-- Description: Permissions for Clases / Actividades module

INSERT INTO permisos (clave, nombre, modulo, descripcion) VALUES
  ('clases.ver',      'Ver clases',      'clases', 'Listar clases / actividades'),
  ('clases.crear',    'Crear clases',    'clases', 'Registrar clases / actividades'),
  ('clases.editar',   'Editar clases',   'clases', 'Modificar clases / actividades'),
  ('clases.archivar', 'Archivar clases', 'clases', 'Archivar/restaurar clases'),
  ('clases.eliminar', 'Eliminar clases', 'clases', 'Eliminar clases / actividades')
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  modulo = EXCLUDED.modulo,
  descripcion = EXCLUDED.descripcion;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'Administrador'
  AND p.clave LIKE 'clases.%'
ON CONFLICT DO NOTHING;
