-- Migration: 025_compras_recibir_permiso.sql
-- Description: Permission for marking a pending compra as received

INSERT INTO permisos (clave, nombre, modulo, descripcion) VALUES
  ('compras.recibir', 'Recibir compras', 'compras', 'Marcar una compra pendiente como recibida')
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  modulo = EXCLUDED.modulo,
  descripcion = EXCLUDED.descripcion;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'Administrador'
  AND p.clave = 'compras.recibir'
ON CONFLICT DO NOTHING;
