-- =============================================================
-- 003_create_trainers.sql
-- =============================================================
BEGIN;

CREATE SCHEMA IF NOT EXISTS gym;
SET search_path TO gym;

CREATE TABLE trainers (
  id              BIGSERIAL PRIMARY KEY,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  document_number VARCHAR(30)  NOT NULL,
  email           VARCHAR(150) NOT NULL,
  phone           VARCHAR(30)  NOT NULL,
  specialty       VARCHAR(150),
  hire_date       DATE,
  photo_url       VARCHAR(255),
  notes           TEXT,
  is_active       BOOLEAN   NOT NULL DEFAULT TRUE,
  is_archived     BOOLEAN   NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_trainers_document_number UNIQUE (document_number),
  CONSTRAINT uq_trainers_email UNIQUE (email),
  CONSTRAINT uq_trainers_phone UNIQUE (phone),
  CONSTRAINT chk_trainers_hire_date CHECK (hire_date IS NULL OR hire_date <= CURRENT_DATE)
);

CREATE INDEX idx_trainers_document_number ON trainers(document_number);
CREATE INDEX idx_trainers_email ON trainers(email);
CREATE INDEX idx_trainers_is_active ON trainers(is_active);
CREATE INDEX idx_trainers_is_archived ON trainers(is_archived);

COMMIT;
