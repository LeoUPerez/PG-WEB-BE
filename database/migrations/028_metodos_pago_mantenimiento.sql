-- Migration: 028_metodos_pago_mantenimiento.sql
-- Description: Permissions for the Métodos de Pago maintenance module

ALTER TABLE metodos_pago ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

INSERT INTO permisos (clave, nombre, modulo, descripcion) VALUES
  ('metodos_pago.ver',    'Ver métodos de pago',    'metodos_pago', 'Listar métodos de pago'),
  ('metodos_pago.crear',  'Crear métodos de pago',  'metodos_pago', 'Registrar métodos de pago'),
  ('metodos_pago.editar', 'Editar métodos de pago', 'metodos_pago', 'Modificar métodos de pago')
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  modulo = EXCLUDED.modulo,
  descripcion = EXCLUDED.descripcion;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'Administrador'
  AND p.clave IN ('metodos_pago.ver', 'metodos_pago.crear', 'metodos_pago.editar')
ON CONFLICT DO NOTHING;
