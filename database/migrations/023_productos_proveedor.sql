-- Migration: 023_productos_proveedor.sql
-- Description: Link each product to the supplier it's bought from, so Compras
-- can filter which products are offered by the selected proveedor.

ALTER TABLE productos ADD COLUMN IF NOT EXISTS proveedor_id INTEGER REFERENCES proveedores(id);

CREATE INDEX IF NOT EXISTS idx_productos_proveedor ON productos(proveedor_id);
