-- =============================================================
-- Seed: 001_admin_user.sql
-- Creates the default admin role and admin user
-- Password: admin123  (bcrypt hash — change after first login)
-- =============================================================

-- Admin role
INSERT INTO roles (nombre, descripcion, estado)
VALUES ('Administrador', 'Acceso total al sistema', true)
ON CONFLICT (nombre) DO NOTHING;

-- Admin user
-- usuario: admin
-- password: admin123
INSERT INTO usuarios (usuario, nombre, password, rol, estado, archivado)
VALUES (
  'admin',
  'Administrador',
  '$2b$10$LQA9NLJwLW6XZCCggUbEHebl6uUR67gZv69VF2oI0D6PSdYGNgj5K',
  'Administrador',
  true,
  false
)
ON CONFLICT (usuario) DO NOTHING;
