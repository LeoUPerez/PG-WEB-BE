-- =============================================================
-- 010_create_inventory.sql
-- Stock balance (current) + movements (audit / source of truth)
-- =============================================================
BEGIN;

CREATE SCHEMA IF NOT EXISTS gym;
SET search_path TO gym;

CREATE TABLE inventory_stock (
  product_id BIGINT  PRIMARY KEY,
  quantity   INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_inventory_stock_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT chk_inventory_stock_quantity CHECK (quantity >= 0)
);

CREATE TABLE inventory_movements (
  id            BIGSERIAL PRIMARY KEY,
  product_id    BIGINT       NOT NULL,
  movement_type VARCHAR(20)  NOT NULL,
  quantity      INTEGER      NOT NULL,
  unit_cost     NUMERIC(10,2),
  sale_id       BIGINT,
  purchase_id   BIGINT,
  notes         TEXT,
  created_by    BIGINT,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_inventory_movements_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_inventory_movements_sale
    FOREIGN KEY (sale_id) REFERENCES sales(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_inventory_movements_purchase
    FOREIGN KEY (purchase_id) REFERENCES purchases(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_inventory_movements_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_inventory_movements_type
    CHECK (movement_type IN ('ENTRY', 'EXIT', 'SALE', 'PURCHASE', 'ADJUSTMENT')),
  CONSTRAINT chk_inventory_movements_quantity CHECK (quantity <> 0),
  CONSTRAINT chk_inventory_movements_unit_cost
    CHECK (unit_cost IS NULL OR unit_cost >= 0),
  -- At most one originating document; ENTRY/ADJUSTMENT may have none
  CONSTRAINT chk_inventory_movements_single_doc
    CHECK (NOT (sale_id IS NOT NULL AND purchase_id IS NOT NULL)),
  CONSTRAINT chk_inventory_movements_sale_type
    CHECK (sale_id IS NULL OR movement_type = 'SALE'),
  CONSTRAINT chk_inventory_movements_purchase_type
    CHECK (purchase_id IS NULL OR movement_type = 'PURCHASE')
);

CREATE INDEX idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX idx_inventory_movements_created_at ON inventory_movements(created_at);
CREATE INDEX idx_inventory_movements_sale_id ON inventory_movements(sale_id);
CREATE INDEX idx_inventory_movements_purchase_id ON inventory_movements(purchase_id);

COMMIT;
