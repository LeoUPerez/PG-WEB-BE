-- Down: 035_entradas_estado_pendiente.sql
-- Fails if any entrada still has estado = 'Pendiente'.

DELETE FROM rol_permisos
WHERE permiso_id IN (SELECT id FROM permisos WHERE clave = 'entradas.recibir');

DELETE FROM permisos WHERE clave = 'entradas.recibir';

ALTER TABLE entradas DROP CONSTRAINT IF EXISTS chk_entradas_estado;
ALTER TABLE entradas ADD CONSTRAINT chk_entradas_estado
  CHECK (estado IN ('Completada', 'Anulada'));
