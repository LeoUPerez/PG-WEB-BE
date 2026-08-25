-- Migration: 033_abonos_comprobante.sql
-- Description: Comprobante de transferencia para abonos (igual que en Cobros)

ALTER TABLE abonos ADD COLUMN IF NOT EXISTS comprobante_url VARCHAR(255);
