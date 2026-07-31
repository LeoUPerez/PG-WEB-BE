-- =============================================================
-- 011_create_charges.sql
-- Charges are created before payment; balance tracks remainder
-- =============================================================
BEGIN;

CREATE SCHEMA IF NOT EXISTS gym;
SET search_path TO gym;

CREATE TABLE charge_types (
  id          BIGSERIAL PRIMARY KEY,
  code        VARCHAR(50)  NOT NULL,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  is_active   BOOLEAN   NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_charge_types_code UNIQUE (code),
  CONSTRAINT uq_charge_types_name UNIQUE (name)
);

CREATE TABLE charges (
  id                      BIGSERIAL PRIMARY KEY,
  customer_id             BIGINT        NOT NULL,
  charge_type_id          BIGINT        NOT NULL,
  customer_membership_id  BIGINT,
  sale_id                 BIGINT,
  description             TEXT          NOT NULL,
  amount                  NUMERIC(10,2) NOT NULL,
  balance                 NUMERIC(10,2) NOT NULL,
  due_date                DATE,
  status                  VARCHAR(20)   NOT NULL DEFAULT 'pending',
  created_by              BIGINT,
  created_at              TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMP     NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_charges_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_charges_type
    FOREIGN KEY (charge_type_id) REFERENCES charge_types(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_charges_membership
    FOREIGN KEY (customer_membership_id) REFERENCES customer_memberships(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_charges_sale
    FOREIGN KEY (sale_id) REFERENCES sales(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_charges_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_charges_amount CHECK (amount > 0),
  CONSTRAINT chk_charges_balance CHECK (balance >= 0 AND balance <= amount),
  CONSTRAINT chk_charges_status
    CHECK (status IN ('pending', 'partial', 'paid', 'cancelled', 'overdue'))
);

CREATE INDEX idx_charges_customer_id ON charges(customer_id);
CREATE INDEX idx_charges_charge_type_id ON charges(charge_type_id);
CREATE INDEX idx_charges_status ON charges(status);
CREATE INDEX idx_charges_due_date ON charges(due_date);
CREATE INDEX idx_charges_customer_membership_id ON charges(customer_membership_id);
CREATE INDEX idx_charges_sale_id ON charges(sale_id);

COMMIT;
