-- Migration: 021_reservas_slot_partial_unique.sql
-- Description: A cancelled reservation should free up its slot so the same
-- person can book that horario/fecha again. The old constraint blocked that.

ALTER TABLE reservas_clases DROP CONSTRAINT IF EXISTS uq_reservas_clases_slot;

CREATE UNIQUE INDEX IF NOT EXISTS uq_reservas_clases_slot_activa
  ON reservas_clases (horario_id, fecha_clase, cedula)
  WHERE estado <> 'Cancelada';
