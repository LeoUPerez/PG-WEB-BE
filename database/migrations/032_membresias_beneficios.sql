-- Migration: 032_membresias_beneficios.sql
-- Description: Required description + structured benefits array on memberships

-- Backfill empty descriptions before enforcing NOT NULL
UPDATE membresias
SET descripcion = 'Sin descripción'
WHERE descripcion IS NULL OR TRIM(descripcion) = '';

ALTER TABLE membresias
  ALTER COLUMN descripcion SET NOT NULL;

ALTER TABLE membresias
  ADD COLUMN IF NOT EXISTS beneficios JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN membresias.beneficios IS 'Ordered list of benefit strings included in the plan';
