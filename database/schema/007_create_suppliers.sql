-- =============================================================
-- 007_create_suppliers.sql
-- =============================================================
BEGIN;

CREATE SCHEMA IF NOT EXISTS gym;
SET search_path TO gym;

CREATE TABLE suppliers (
  id           BIGSERIAL PRIMARY KEY,
  name         VARCHAR(200) NOT NULL,
  tax_id       VARCHAR(30),
  contact_name VARCHAR(150) NOT NULL,
  phone        VARCHAR(30)  NOT NULL,
  email        VARCHAR(150) NOT NULL,
  address      TEXT         NOT NULL,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_suppliers_email UNIQUE (email)
);

CREATE UNIQUE INDEX uq_suppliers_tax_id
  ON suppliers(tax_id)
  WHERE tax_id IS NOT NULL AND tax_id <> '';

CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_email ON suppliers(email);
CREATE INDEX idx_suppliers_is_active ON suppliers(is_active);

COMMIT;
