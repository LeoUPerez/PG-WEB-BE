-- Migration: 037_entradas_editar.sql
-- Description: Permission to edit pending (en camino) entradas

INSERT INTO permisos (clave, nombre, modulo, descripcion) VALUES
  ('entradas.editar', 'Editar entradas', 'entradas', 'Corregir proveedor, referencia o productos de una entrada en camino')
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  modulo = EXCLUDED.modulo,
  descripcion = EXCLUDED.descripcion;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'Administrador'
  AND p.clave = 'entradas.editar'
ON CONFLICT DO NOTHING;
