-- =============================================================
-- 008_create_purchases.sql
-- Header + details; product data never duplicated on lines
-- =============================================================
BEGIN;

CREATE SCHEMA IF NOT EXISTS gym;
SET search_path TO gym;

CREATE TABLE purchases (
  id             BIGSERIAL PRIMARY KEY,
  supplier_id    BIGINT       NOT NULL,
  purchase_date  DATE         NOT NULL DEFAULT CURRENT_DATE,
  invoice_number VARCHAR(50),
  status         VARCHAR(20)  NOT NULL DEFAULT 'draft',
  subtotal       NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_amount     NUMERIC(10,2) NOT NULL DEFAULT 0,
  total          NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes          TEXT,
  created_by     BIGINT,
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_purchases_supplier
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_purchases_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_purchases_status
    CHECK (status IN ('draft', 'confirmed', 'cancelled', 'received')),
  CONSTRAINT chk_purchases_subtotal CHECK (subtotal >= 0),
  CONSTRAINT chk_purchases_tax CHECK (tax_amount >= 0),
  CONSTRAINT chk_purchases_total CHECK (total >= 0)
);

CREATE TABLE purchase_details (
  id          BIGSERIAL PRIMARY KEY,
  purchase_id BIGINT        NOT NULL,
  product_id  BIGINT        NOT NULL,
  quantity    INTEGER       NOT NULL,
  unit_cost   NUMERIC(10,2) NOT NULL,
  line_total  NUMERIC(10,2) NOT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_purchase_details_purchase
    FOREIGN KEY (purchase_id) REFERENCES purchases(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_purchase_details_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_purchase_details_quantity CHECK (quantity > 0),
  CONSTRAINT chk_purchase_details_unit_cost CHECK (unit_cost >= 0),
  CONSTRAINT chk_purchase_details_line_total CHECK (line_total >= 0),
  CONSTRAINT uq_purchase_details_purchase_product UNIQUE (purchase_id, product_id)
);

CREATE INDEX idx_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX idx_purchases_purchase_date ON purchases(purchase_date);
CREATE INDEX idx_purchases_status ON purchases(status);
CREATE INDEX idx_purchase_details_purchase_id ON purchase_details(purchase_id);
CREATE INDEX idx_purchase_details_product_id ON purchase_details(product_id);

COMMIT;
