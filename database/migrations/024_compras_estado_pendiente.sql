-- Migration: 024_compras_estado_pendiente.sql
-- Description: Allow a compra to be registered as "Pendiente" (ordered but not
-- yet received) — stock only increases once it's marked as received.

ALTER TABLE compras DROP CONSTRAINT IF EXISTS chk_compras_estado;
ALTER TABLE compras ADD CONSTRAINT chk_compras_estado CHECK (estado IN ('Pendiente', 'Completada', 'Anulada'));
