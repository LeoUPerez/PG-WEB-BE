-- =============================================================
-- 005_create_classes.sql
-- classes, schedules, reservations, attendances
-- =============================================================
BEGIN;

CREATE SCHEMA IF NOT EXISTS gym;
SET search_path TO gym;

CREATE TABLE classes (
  id               BIGSERIAL PRIMARY KEY,
  name             VARCHAR(150) NOT NULL,
  description      TEXT,
  default_capacity INTEGER      NOT NULL DEFAULT 20,
  duration_minutes INTEGER      NOT NULL DEFAULT 60,
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_classes_name UNIQUE (name),
  CONSTRAINT chk_classes_capacity CHECK (default_capacity > 0),
  CONSTRAINT chk_classes_duration CHECK (duration_minutes > 0)
);

CREATE TABLE class_schedules (
  id         BIGSERIAL PRIMARY KEY,
  class_id   BIGINT      NOT NULL,
  trainer_id BIGINT      NOT NULL,
  starts_at  TIMESTAMP   NOT NULL,
  ends_at    TIMESTAMP   NOT NULL,
  capacity   INTEGER     NOT NULL,
  room       VARCHAR(100),
  status     VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  notes      TEXT,
  created_at TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP   NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_class_schedules_class
    FOREIGN KEY (class_id) REFERENCES classes(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_class_schedules_trainer
    FOREIGN KEY (trainer_id) REFERENCES trainers(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_class_schedules_times CHECK (ends_at > starts_at),
  CONSTRAINT chk_class_schedules_capacity CHECK (capacity > 0),
  CONSTRAINT chk_class_schedules_status
    CHECK (status IN ('scheduled', 'cancelled', 'completed'))
);

CREATE TABLE class_reservations (
  id          BIGSERIAL PRIMARY KEY,
  schedule_id BIGINT      NOT NULL,
  customer_id BIGINT      NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'reserved',
  reserved_at TIMESTAMP   NOT NULL DEFAULT NOW(),
  notes       TEXT,
  created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_class_reservations_schedule_customer UNIQUE (schedule_id, customer_id),
  CONSTRAINT fk_class_reservations_schedule
    FOREIGN KEY (schedule_id) REFERENCES class_schedules(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_class_reservations_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_class_reservations_status
    CHECK (status IN ('reserved', 'cancelled', 'waitlisted', 'attended', 'no_show'))
);

CREATE TABLE attendances (
  id             BIGSERIAL PRIMARY KEY,
  reservation_id BIGINT      NOT NULL,
  check_in_at    TIMESTAMP   NOT NULL DEFAULT NOW(),
  check_out_at   TIMESTAMP,
  status         VARCHAR(20) NOT NULL DEFAULT 'present',
  recorded_by    BIGINT,
  notes          TEXT,
  created_at     TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_attendances_reservation UNIQUE (reservation_id),
  CONSTRAINT fk_attendances_reservation
    FOREIGN KEY (reservation_id) REFERENCES class_reservations(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_attendances_recorded_by
    FOREIGN KEY (recorded_by) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_attendances_status
    CHECK (status IN ('present', 'late', 'left_early', 'no_show')),
  CONSTRAINT chk_attendances_checkout
    CHECK (check_out_at IS NULL OR check_out_at >= check_in_at)
);

CREATE INDEX idx_class_schedules_class_id ON class_schedules(class_id);
CREATE INDEX idx_class_schedules_trainer_id ON class_schedules(trainer_id);
CREATE INDEX idx_class_schedules_starts_at ON class_schedules(starts_at);
CREATE INDEX idx_class_schedules_status ON class_schedules(status);
CREATE INDEX idx_class_reservations_schedule_id ON class_reservations(schedule_id);
CREATE INDEX idx_class_reservations_customer_id ON class_reservations(customer_id);
CREATE INDEX idx_class_reservations_status ON class_reservations(status);
CREATE INDEX idx_attendances_check_in_at ON attendances(check_in_at);

COMMIT;
