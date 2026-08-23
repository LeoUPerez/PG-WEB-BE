-- Migration: 026_cobros_pago_online.sql
-- Description: Allow a cobro to be created as "Pendiente" (a quote emailed to
-- the client, paid via a simulated card-payment link) instead of always being
-- completed on the spot.

ALTER TABLE cobros DROP CONSTRAINT IF EXISTS chk_cobros_estado;
ALTER TABLE cobros ADD CONSTRAINT chk_cobros_estado CHECK (estado IN ('Pendiente', 'Completado', 'Anulado'));
ALTER TABLE cobros ALTER COLUMN estado SET DEFAULT 'Completado';

ALTER TABLE cobros ADD COLUMN IF NOT EXISTS token VARCHAR(64);
ALTER TABLE cobros ADD COLUMN IF NOT EXISTS email_pago VARCHAR(150);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cobros_token ON cobros(token) WHERE token IS NOT NULL;
