BEGIN;

DELETE FROM rol_permisos
WHERE permiso_id IN (SELECT id FROM permisos WHERE clave LIKE 'entradas.%');

DELETE FROM permisos WHERE clave LIKE 'entradas.%';

DROP TABLE IF EXISTS entrada_detalle CASCADE;
DROP TABLE IF EXISTS entradas CASCADE;

COMMIT;
