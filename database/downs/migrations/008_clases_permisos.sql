-- Down: 008_clases_permisos.sql

DELETE FROM rol_permisos
WHERE permiso_id IN (SELECT id FROM permisos WHERE clave LIKE 'clases.%');

DELETE FROM permisos WHERE clave LIKE 'clases.%';
