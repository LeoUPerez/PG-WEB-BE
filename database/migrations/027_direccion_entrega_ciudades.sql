-- Migration: 027_direccion_entrega_ciudades.sql
-- Description: Structured delivery address + coverage cities + coverage requests

CREATE TABLE IF NOT EXISTS ciudades_entrega (
  id         SERIAL PRIMARY KEY,
  nombre     VARCHAR(120) NOT NULL UNIQUE,
  activa     BOOLEAN      NOT NULL DEFAULT true,
  orden      INTEGER      NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ciudades_entrega_activa ON ciudades_entrega(activa);

CREATE TABLE IF NOT EXISTS solicitudes_cobertura (
  id                 SERIAL PRIMARY KEY,
  ciudad_solicitada  VARCHAR(120) NOT NULL,
  email              VARCHAR(150) NOT NULL,
  telefono           VARCHAR(30),
  nombre             VARCHAR(150),
  comentario         TEXT,
  estado             VARCHAR(20)  NOT NULL DEFAULT 'Pendiente',
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_solicitudes_cobertura_estado
    CHECK (estado IN ('Pendiente', 'Revisada', 'Descartada'))
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_cobertura_estado ON solicitudes_cobertura(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_cobertura_email ON solicitudes_cobertura(email);

ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS ciudad_id     INTEGER REFERENCES ciudades_entrega(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ciudad_nombre VARCHAR(120),
  ADD COLUMN IF NOT EXISTS sector        VARCHAR(120),
  ADD COLUMN IF NOT EXISTS calle         VARCHAR(200),
  ADD COLUMN IF NOT EXISTS numero_casa   VARCHAR(60),
  ADD COLUMN IF NOT EXISTS referencias   TEXT;

CREATE INDEX IF NOT EXISTS idx_ventas_ciudad ON ventas(ciudad_id);

INSERT INTO ciudades_entrega (nombre, activa, orden) VALUES
  ('Santo Domingo', true, 10),
  ('Santiago', true, 20),
  ('La Vega', true, 30),
  ('San Cristóbal', true, 40)
ON CONFLICT (nombre) DO NOTHING;
