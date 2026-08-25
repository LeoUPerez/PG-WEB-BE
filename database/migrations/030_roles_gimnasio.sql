-- Migration: 030_roles_gimnasio.sql
-- Description: Roles operativos del gimnasio (Recepcionista, Entrenador, Kiosco)

INSERT INTO roles (nombre) VALUES
  ('Recepcionista'),
  ('Entrenador'),
  ('Kiosco')
ON CONFLICT (nombre) DO NOTHING;

-- Recepcionista: atiende clientes, membresías, cobros, cargos, reservas y asistencia
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'Recepcionista'
  AND p.clave IN (
    'dashboard.ver',
    'clientes.ver', 'clientes.crear', 'clientes.editar',
    'asignaciones.ver', 'asignaciones.crear', 'asignaciones.cancelar',
    'renovaciones.ver', 'renovaciones.crear',
    'cargos.ver', 'cargos.crear', 'cargos.cancelar',
    'cobros.ver', 'cobros.crear', 'cobros.anular',
    'reservas.ver', 'reservas.gestionar',
    'asistencias.ver', 'asistencias.registrar',
    'membresias.ver',
    'metodos_pago.ver'
  )
ON CONFLICT DO NOTHING;

-- Entrenador: solo lo que necesita ver para dar sus clases
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'Entrenador'
  AND p.clave IN (
    'dashboard.ver',
    'clases.ver',
    'horarios.ver',
    'clientes.ver',
    'reservas.ver',
    'asistencias.ver'
  )
ON CONFLICT DO NOTHING;

-- Kiosco: cuenta dedicada para el tablet de la entrada. Únicamente puede
-- registrar asistencia (ni siquiera puede consultar el historial), para que
-- si alguien sale del modo kiosco no tenga acceso a nada más del sistema.
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'Kiosco'
  AND p.clave = 'asistencias.registrar'
ON CONFLICT DO NOTHING;
