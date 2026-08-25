-- Down: 037_entradas_editar.sql

DELETE FROM rol_permisos
WHERE permiso_id IN (SELECT id FROM permisos WHERE clave = 'entradas.editar');

DELETE FROM permisos WHERE clave = 'entradas.editar';
