-- Migration: 020_reservas_token.sql
-- Description: Token for self-service confirm/cancel of a reservation via emailed link

ALTER TABLE reservas_clases ADD COLUMN IF NOT EXISTS token VARCHAR(64);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reservas_clases_token ON reservas_clases(token) WHERE token IS NOT NULL;
