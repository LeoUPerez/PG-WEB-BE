-- Add schedule and hire-date fields used by the Entrenadores UI
ALTER TABLE entrenadores
  ADD COLUMN IF NOT EXISTS horario TEXT,
  ADD COLUMN IF NOT EXISTS fecha_contratacion DATE;
