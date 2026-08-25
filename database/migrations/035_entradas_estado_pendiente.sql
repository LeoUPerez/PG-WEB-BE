-- Migration: 035_entradas_estado_pendiente.sql
-- Description: Allow entradas Pendiente (en camino) + permiso confirmar llegada

ALTER TABLE entradas DROP CONSTRAINT IF EXISTS chk_entradas_estado;
ALTER TABLE entradas ADD CONSTRAINT chk_entradas_estado
  CHECK (estado IN ('Pendiente', 'Completada', 'Anulada'));

INSERT INTO permisos (clave, nombre, modulo, descripcion) VALUES
  ('entradas.recibir', 'Confirmar llegada de entradas', 'entradas', 'Marcar una entrada en camino como llegada y actualizar stock')
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  modulo = EXCLUDED.modulo,
  descripcion = EXCLUDED.descripcion;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'Administrador'
  AND p.clave = 'entradas.recibir'
ON CONFLICT DO NOTHING;
