-- Down: 034_ventas_metodo_pago_catalogo.sql
-- Restores the original CHECK. Fails if there are metodo_pago values outside the old set.

ALTER TABLE ventas DROP CONSTRAINT IF EXISTS chk_ventas_metodo_pago;

ALTER TABLE ventas ADD CONSTRAINT chk_ventas_metodo_pago CHECK (metodo_pago IN (
  'SimuladoTarjeta', 'Efectivo', 'Tarjeta', 'Transferencia', 'PendienteRecepcion'
));
