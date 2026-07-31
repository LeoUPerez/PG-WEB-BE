-- =============================================================
-- 009_create_sales.sql
-- POS sales header + details
-- =============================================================
BEGIN;

CREATE SCHEMA IF NOT EXISTS gym;
SET search_path TO gym;

CREATE TABLE sales (
  id          BIGSERIAL PRIMARY KEY,
  customer_id BIGINT,
  sale_date   TIMESTAMP    NOT NULL DEFAULT NOW(),
  status      VARCHAR(20)  NOT NULL DEFAULT 'completed',
  subtotal    NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_amount  NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount    NUMERIC(10,2) NOT NULL DEFAULT 0,
  total       NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes       TEXT,
  created_by  BIGINT,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_sales_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_sales_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_sales_status
    CHECK (status IN ('draft', 'completed', 'cancelled', 'refunded')),
  CONSTRAINT chk_sales_subtotal CHECK (subtotal >= 0),
  CONSTRAINT chk_sales_tax CHECK (tax_amount >= 0),
  CONSTRAINT chk_sales_discount CHECK (discount >= 0),
  CONSTRAINT chk_sales_total CHECK (total >= 0)
);

CREATE TABLE sale_details (
  id         BIGSERIAL PRIMARY KEY,
  sale_id    BIGINT        NOT NULL,
  product_id BIGINT        NOT NULL,
  quantity   INTEGER       NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  line_total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP     NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_sale_details_sale
    FOREIGN KEY (sale_id) REFERENCES sales(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_sale_details_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_sale_details_quantity CHECK (quantity > 0),
  CONSTRAINT chk_sale_details_unit_price CHECK (unit_price >= 0),
  CONSTRAINT chk_sale_details_line_total CHECK (line_total >= 0),
  CONSTRAINT uq_sale_details_sale_product UNIQUE (sale_id, product_id)
);

CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_sale_date ON sales(sale_date);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sale_details_sale_id ON sale_details(sale_id);
CREATE INDEX idx_sale_details_product_id ON sale_details(product_id);

COMMIT;
