-- =============================================================
-- Seed: usuario exclusivo para el panel de control del camión
-- usuario: managetruck
-- password: managetruck123  (cambiar después del primer login)
-- No es Administrador: no hereda ventas.* ni el resto del sistema.
-- =============================================================

INSERT INTO roles (nombre, descripcion, estado)
VALUES (
  'ControlCamion',
  'Solo control de avance del camión de entregas',
  true
)
ON CONFLICT (nombre) DO NOTHING;

-- Acceso mínimo al shell del sistema (dashboard) para no quedar bloqueado tras el login.
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'ControlCamion'
  AND p.clave = 'dashboard.ver'
ON CONFLICT DO NOTHING;

INSERT INTO usuarios (usuario, nombre, password, rol, estado, archivado)
VALUES (
  'managetruck',
  'Control de Camión',
  '$2b$10$93RMXAghKiDoDraCEM7Pi.a3OQD05Ac8fJn.puLSyJ5Ux5YnLLQWG',
  'ControlCamion',
  true,
  false
)
ON CONFLICT (usuario) DO NOTHING;
