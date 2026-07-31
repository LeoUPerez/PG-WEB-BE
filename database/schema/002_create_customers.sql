-- =============================================================
-- 002_create_customers.sql
-- Gym members / customers (no membership data embedded)
-- =============================================================
BEGIN;

CREATE SCHEMA IF NOT EXISTS gym;
SET search_path TO gym;

CREATE TABLE customers (
  id              BIGSERIAL PRIMARY KEY,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  document_number VARCHAR(30)  NOT NULL,
  email           VARCHAR(150),
  phone           VARCHAR(30),
  address         TEXT,
  birth_date      DATE,
  gender          CHAR(1),
  photo_url       VARCHAR(255),
  notes           TEXT,
  is_active       BOOLEAN   NOT NULL DEFAULT TRUE,
  is_archived     BOOLEAN   NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_customers_document_number UNIQUE (document_number),
  CONSTRAINT uq_customers_email UNIQUE (email),
  CONSTRAINT chk_customers_gender CHECK (gender IS NULL OR gender IN ('M', 'F', 'O')),
  CONSTRAINT chk_customers_birth_date CHECK (birth_date IS NULL OR birth_date <= CURRENT_DATE)
);

CREATE INDEX idx_customers_document_number ON customers(document_number);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_is_active ON customers(is_active);
CREATE INDEX idx_customers_is_archived ON customers(is_archived);
CREATE INDEX idx_customers_last_name ON customers(last_name);

COMMIT;
