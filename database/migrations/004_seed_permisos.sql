-- =============================================================
-- Seed: permission catalogue + assign all to Administrador
-- Required for sidebar "Mantenimientos" and page access checks
-- =============================================================

ALTER TABLE permisos
  ADD COLUMN IF NOT EXISTS nombre      VARCHAR(150),
  ADD COLUMN IF NOT EXISTS modulo      VARCHAR(50),
  ADD COLUMN IF NOT EXISTS descripcion TEXT;

INSERT INTO permisos (clave, nombre, modulo, descripcion) VALUES
  ('dashboard.ver',       'Ver dashboard',        'dashboard',    'Acceso al panel principal'),
  ('clientes.ver',        'Ver clientes',         'clientes',     'Listar clientes'),
  ('clientes.crear',      'Crear clientes',       'clientes',     'Registrar clientes'),
  ('clientes.editar',     'Editar clientes',      'clientes',     'Modificar clientes'),
  ('clientes.archivar',   'Archivar clientes',    'clientes',     'Archivar/restaurar clientes'),
  ('entrenadores.ver',    'Ver entrenadores',     'entrenadores', 'Listar entrenadores'),
  ('entrenadores.crear',  'Crear entrenadores',   'entrenadores', 'Registrar entrenadores'),
  ('entrenadores.editar', 'Editar entrenadores',  'entrenadores', 'Modificar entrenadores'),
  ('entrenadores.archivar','Archivar entrenadores','entrenadores','Archivar/restaurar entrenadores'),
  ('categorias.ver',      'Ver categorías',       'categorias',   'Listar categorías'),
  ('categorias.crear',    'Crear categorías',     'categorias',   'Registrar categorías'),
  ('categorias.editar',   'Editar categorías',    'categorias',   'Modificar categorías'),
  ('categorias.archivar', 'Archivar categorías',  'categorias',   'Archivar/restaurar categorías'),
  ('productos.ver',       'Ver productos',        'productos',    'Listar productos'),
  ('productos.crear',     'Crear productos',      'productos',    'Registrar productos'),
  ('productos.editar',    'Editar productos',     'productos',    'Modificar productos'),
  ('proveedores.ver',     'Ver proveedores',      'proveedores',  'Listar proveedores'),
  ('proveedores.crear',   'Crear proveedores',    'proveedores',  'Registrar proveedores'),
  ('proveedores.editar',  'Editar proveedores',   'proveedores',  'Modificar proveedores'),
  ('usuarios.ver',        'Ver usuarios',         'usuarios',     'Listar usuarios'),
  ('usuarios.crear',      'Crear usuarios',       'usuarios',     'Registrar usuarios'),
  ('usuarios.editar',     'Editar usuarios',      'usuarios',     'Modificar usuarios'),
  ('usuarios.archivar',   'Archivar usuarios',    'usuarios',     'Archivar/restaurar usuarios'),
  ('roles.ver',           'Ver roles',            'roles',        'Listar roles y permisos'),
  ('roles.crear',         'Crear roles',          'roles',        'Registrar roles'),
  ('roles.editar',        'Editar roles',         'roles',        'Modificar roles y permisos')
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  modulo = EXCLUDED.modulo,
  descripcion = EXCLUDED.descripcion;

-- Give Administrador every permission
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'Administrador'
ON CONFLICT DO NOTHING;
