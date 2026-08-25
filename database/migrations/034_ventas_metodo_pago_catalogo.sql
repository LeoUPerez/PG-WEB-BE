-- Migration: 034_ventas_metodo_pago_catalogo.sql
-- Description: Allow ventas.metodo_pago to use names from metodos_pago (same catalog as cobros).
-- System values PendienteRecepcion / SimuladoTarjeta remain valid for public checkout.

ALTER TABLE ventas DROP CONSTRAINT IF EXISTS chk_ventas_metodo_pago;
