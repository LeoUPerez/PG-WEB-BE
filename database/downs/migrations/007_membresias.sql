BEGIN;

DELETE FROM rol_permisos
WHERE permiso_id IN (SELECT id FROM permisos WHERE clave LIKE 'membresias.%');

DELETE FROM permisos WHERE clave LIKE 'membresias.%';

DROP TABLE IF EXISTS membresias CASCADE;

COMMIT;
