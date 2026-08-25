BEGIN;

ALTER TABLE membresias
  DROP COLUMN IF EXISTS beneficios;

ALTER TABLE membresias
  ALTER COLUMN descripcion DROP NOT NULL;

COMMIT;
