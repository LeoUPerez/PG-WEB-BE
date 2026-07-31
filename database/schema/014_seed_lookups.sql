-- =============================================================
-- 014_seed_lookups.sql
-- Catalog seeds: payment methods, charge types, base admin RBAC
-- =============================================================
BEGIN;

CREATE SCHEMA IF NOT EXISTS gym;
SET search_path TO gym;

INSERT INTO payment_methods (code, name) VALUES
  ('CASH', 'Efectivo'),
  ('CARD', 'Tarjeta'),
  ('TRANSFER', 'Transferencia'),
  ('CHECK', 'Cheque'),
  ('OTHER', 'Otro')
ON CONFLICT (code) DO NOTHING;

INSERT INTO charge_types (code, name, description) VALUES
  ('MEMBERSHIP', 'Membresía', 'Cargo por plan de membresía'),
  ('PRODUCT_CREDIT', 'Crédito de producto', 'Productos vendidos a crédito'),
  ('PENALTY', 'Penalidad', 'Multas o cargos por incumplimiento'),
  ('OTHER', 'Otro', 'Cargo genérico')
ON CONFLICT (code) DO NOTHING;

INSERT INTO roles (name, description, is_active)
VALUES ('Administrador', 'Acceso total al sistema', TRUE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (code, name, module, description) VALUES
  ('dashboard.view', 'Ver dashboard', 'dashboard', 'Acceso al panel'),
  ('customers.view', 'Ver clientes', 'customers', 'Listar clientes'),
  ('customers.create', 'Crear clientes', 'customers', 'Registrar clientes'),
  ('customers.update', 'Editar clientes', 'customers', 'Modificar clientes'),
  ('customers.archive', 'Archivar clientes', 'customers', 'Archivar clientes'),
  ('trainers.view', 'Ver entrenadores', 'trainers', 'Listar entrenadores'),
  ('trainers.create', 'Crear entrenadores', 'trainers', 'Registrar entrenadores'),
  ('trainers.update', 'Editar entrenadores', 'trainers', 'Modificar entrenadores'),
  ('trainers.archive', 'Archivar entrenadores', 'trainers', 'Archivar entrenadores'),
  ('memberships.view', 'Ver membresías', 'memberships', 'Listar membresías'),
  ('memberships.manage', 'Gestionar membresías', 'memberships', 'Crear/editar membresías'),
  ('classes.view', 'Ver clases', 'classes', 'Listar clases'),
  ('classes.manage', 'Gestionar clases', 'classes', 'Horarios y reservas'),
  ('products.view', 'Ver productos', 'products', 'Listar productos'),
  ('products.manage', 'Gestionar productos', 'products', 'CRUD productos'),
  ('suppliers.view', 'Ver proveedores', 'suppliers', 'Listar proveedores'),
  ('suppliers.manage', 'Gestionar proveedores', 'suppliers', 'CRUD proveedores'),
  ('purchases.view', 'Ver compras', 'purchases', 'Listar compras'),
  ('purchases.manage', 'Gestionar compras', 'purchases', 'Registrar compras'),
  ('sales.view', 'Ver ventas', 'sales', 'Listar ventas'),
  ('sales.manage', 'Gestionar ventas', 'sales', 'POS / ventas'),
  ('inventory.view', 'Ver inventario', 'inventory', 'Consultar stock'),
  ('inventory.manage', 'Ajustar inventario', 'inventory', 'Movimientos y ajustes'),
  ('charges.view', 'Ver cargos', 'charges', 'Listar cargos'),
  ('charges.manage', 'Gestionar cargos', 'charges', 'Crear cargos'),
  ('payments.view', 'Ver pagos', 'payments', 'Listar pagos'),
  ('payments.manage', 'Registrar pagos', 'payments', 'Aplicar pagos'),
  ('users.view', 'Ver usuarios', 'users', 'Listar usuarios'),
  ('users.manage', 'Gestionar usuarios', 'users', 'CRUD usuarios'),
  ('roles.view', 'Ver roles', 'roles', 'Listar roles'),
  ('roles.manage', 'Gestionar roles', 'roles', 'Roles y permisos')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Administrador'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Default admin user: password must be bcrypt-hashed by the app before insert.
-- Placeholder hash below is bcrypt for "admin123" — change after first login.
INSERT INTO users (username, email, password_hash, full_name, is_active)
VALUES (
  'admin',
  'admin@gym.local',
  '$2b$10$LQA9NLJwLW6XZCCggUbEHebl6uUR67gZv69VF2oI0D6PSdYGNgj5K',
  'Administrador del Sistema',
  TRUE
)
ON CONFLICT (username) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.username = 'admin' AND r.name = 'Administrador'
ON CONFLICT (user_id, role_id) DO NOTHING;

COMMIT;
