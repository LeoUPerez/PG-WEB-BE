-- =============================================================
-- 006_create_products.sql
-- product_categories + products (no duplicated category names)
-- =============================================================
BEGIN;

CREATE SCHEMA IF NOT EXISTS gym;
SET search_path TO gym;

CREATE TABLE product_categories (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  description TEXT,
  is_active   BOOLEAN   NOT NULL DEFAULT TRUE,
  is_archived BOOLEAN   NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_product_categories_name UNIQUE (name)
);

CREATE TABLE products (
  id             BIGSERIAL PRIMARY KEY,
  category_id    BIGINT,
  code           VARCHAR(50)   NOT NULL,
  name           VARCHAR(200)  NOT NULL,
  description    TEXT,
  purchase_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  sale_price     NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_min      INTEGER       NOT NULL DEFAULT 0,
  image_url      VARCHAR(255),
  is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP     NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_products_code UNIQUE (code),
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES product_categories(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_products_purchase_price CHECK (purchase_price >= 0),
  CONSTRAINT chk_products_sale_price CHECK (sale_price >= 0),
  CONSTRAINT chk_products_stock_min CHECK (stock_min >= 0)
);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_product_categories_is_active ON product_categories(is_active);
CREATE INDEX idx_product_categories_is_archived ON product_categories(is_archived);

COMMIT;
