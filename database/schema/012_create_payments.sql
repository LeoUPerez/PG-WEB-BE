-- =============================================================
-- 012_create_payments.sql
-- payments independent of charges; M:N via payment_details
-- =============================================================
BEGIN;

CREATE SCHEMA IF NOT EXISTS gym;
SET search_path TO gym;

CREATE TABLE payment_methods (
  id          BIGSERIAL PRIMARY KEY,
  code        VARCHAR(50)  NOT NULL,
  name        VARCHAR(100) NOT NULL,
  is_active   BOOLEAN   NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_payment_methods_code UNIQUE (code),
  CONSTRAINT uq_payment_methods_name UNIQUE (name)
);

CREATE TABLE payments (
  id                BIGSERIAL PRIMARY KEY,
  customer_id       BIGINT        NOT NULL,
  payment_method_id BIGINT        NOT NULL,
  amount            NUMERIC(10,2) NOT NULL,
  payment_date      TIMESTAMP     NOT NULL DEFAULT NOW(),
  reference_number  VARCHAR(100),
  notes             TEXT,
  created_by        BIGINT,
  created_at        TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP     NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_payments_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_payments_method
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_payments_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_payments_amount CHECK (amount > 0)
);

CREATE TABLE payment_details (
  id             BIGSERIAL PRIMARY KEY,
  payment_id     BIGINT        NOT NULL,
  charge_id      BIGINT        NOT NULL,
  amount_applied NUMERIC(10,2) NOT NULL,
  created_at     TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP     NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_payment_details_payment_charge UNIQUE (payment_id, charge_id),
  CONSTRAINT fk_payment_details_payment
    FOREIGN KEY (payment_id) REFERENCES payments(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_payment_details_charge
    FOREIGN KEY (charge_id) REFERENCES charges(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_payment_details_amount CHECK (amount_applied > 0)
);

CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_payment_method_id ON payments(payment_method_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payment_details_payment_id ON payment_details(payment_id);
CREATE INDEX idx_payment_details_charge_id ON payment_details(charge_id);

COMMIT;
