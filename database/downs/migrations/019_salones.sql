-- Down: 019_salones.sql

DELETE FROM rol_permisos
WHERE permiso_id IN (SELECT id FROM permisos WHERE clave LIKE 'salones.%');

DELETE FROM permisos WHERE clave LIKE 'salones.%';

ALTER TABLE horarios_clases DROP COLUMN IF EXISTS salon_id;

DROP TABLE IF EXISTS salones;
