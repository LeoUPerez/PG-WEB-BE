-- Down: 009_horarios_clases.sql

DELETE FROM rol_permisos
WHERE permiso_id IN (SELECT id FROM permisos WHERE clave LIKE 'horarios.%');

DELETE FROM permisos WHERE clave LIKE 'horarios.%';

DROP TABLE IF EXISTS horarios_clases;
