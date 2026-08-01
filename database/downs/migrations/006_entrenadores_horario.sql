BEGIN;
ALTER TABLE entrenadores
  DROP COLUMN IF EXISTS horario,
  DROP COLUMN IF EXISTS fecha_contratacion;
COMMIT;
