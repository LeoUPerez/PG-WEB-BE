-- Migration: 003_entrenadores.sql
-- Description: Entrenadores table

CREATE TABLE IF NOT EXISTS entrenadores (
  id           SERIAL PRIMARY KEY,
  nombre       VARCHAR(100)  NOT NULL,
  apellido     VARCHAR(100)  NOT NULL,
  cedula       VARCHAR(20)   NOT NULL UNIQUE,
  email        VARCHAR(150)  NOT NULL UNIQUE,
  telefono     VARCHAR(20)   NOT NULL UNIQUE,
  especialidad VARCHAR(150),
  foto         VARCHAR(255),
  estado       VARCHAR(20)   NOT NULL DEFAULT 'Activo',
  archivado    BOOLEAN       NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
