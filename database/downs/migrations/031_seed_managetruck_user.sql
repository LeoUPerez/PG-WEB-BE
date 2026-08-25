-- Down: 028_seed_managetruck_user.sql
DELETE FROM usuarios WHERE usuario = 'managetruck';
DELETE FROM rol_permisos
 WHERE rol_id IN (SELECT id FROM roles WHERE nombre = 'ControlCamion');
DELETE FROM roles WHERE nombre = 'ControlCamion';
