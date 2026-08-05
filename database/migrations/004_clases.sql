-- Migration: 004_clases.sql
-- Description: Clases / Actividades table

CREATE TABLE IF NOT EXISTS clases (
  id                SERIAL PRIMARY KEY,
  nombre            VARCHAR(150)  NOT NULL UNIQUE,
  descripcion       TEXT,
  capacidad         INTEGER       NOT NULL CHECK (capacidad > 0),
  duracion_minutos  INTEGER       NOT NULL CHECK (duracion_minutos > 0),
  estado            VARCHAR(20)   NOT NULL DEFAULT 'Activo',
  archivado         BOOLEAN       NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
