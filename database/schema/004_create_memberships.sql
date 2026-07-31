-- =============================================================
-- 004_create_memberships.sql
-- membership_types (catalog) + customer_memberships (history)
-- =============================================================
BEGIN;

CREATE SCHEMA IF NOT EXISTS gym;
SET search_path TO gym;

CREATE TABLE membership_types (
  id            BIGSERIAL PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  description   TEXT,
  duration_days INTEGER       NOT NULL,
  price         NUMERIC(10,2) NOT NULL,
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_membership_types_name UNIQUE (name),
  CONSTRAINT chk_membership_types_duration CHECK (duration_days > 0),
  CONSTRAINT chk_membership_types_price CHECK (price >= 0)
);

CREATE TABLE customer_memberships (
  id                 BIGSERIAL PRIMARY KEY,
  customer_id        BIGINT       NOT NULL,
  membership_type_id BIGINT       NOT NULL,
  start_date         DATE         NOT NULL,
  end_date           DATE         NOT NULL,
  status             VARCHAR(20)  NOT NULL DEFAULT 'active',
  price_paid         NUMERIC(10,2),
  notes              TEXT,
  created_at         TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_customer_memberships_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_customer_memberships_type
    FOREIGN KEY (membership_type_id) REFERENCES membership_types(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_customer_memberships_dates CHECK (end_date >= start_date),
  CONSTRAINT chk_customer_memberships_status
    CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'suspended')),
  CONSTRAINT chk_customer_memberships_price_paid
    CHECK (price_paid IS NULL OR price_paid >= 0)
);

CREATE INDEX idx_customer_memberships_customer_id ON customer_memberships(customer_id);
CREATE INDEX idx_customer_memberships_type_id ON customer_memberships(membership_type_id);
CREATE INDEX idx_customer_memberships_status ON customer_memberships(status);
CREATE INDEX idx_customer_memberships_start_date ON customer_memberships(start_date);
CREATE INDEX idx_customer_memberships_end_date ON customer_memberships(end_date);
CREATE INDEX idx_membership_types_is_active ON membership_types(is_active);

COMMIT;
