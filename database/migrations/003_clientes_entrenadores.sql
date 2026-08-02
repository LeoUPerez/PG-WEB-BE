-- Migration: 003_clientes_entrenadores.sql
-- Description: Entrenadores and Clientes tables

-- ─────────────────────────────────────────
--  ENTRENADORES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS entrenadores (
  id           SERIAL PRIMARY KEY,
  nombre       VARCHAR(100)  NOT NULL,
  apellido     VARCHAR(100)  NOT NULL,
  cedula       VARCHAR(20)   NOT NULL UNIQUE,
  email        VARCHAR(150)  NOT NULL UNIQUE,
  telefono     VARCHAR(20)   NOT NULL UNIQUE,
  especialidad VARCHAR(255),
  horario      JSONB,
  fecha_contratacion DATE,
  foto         VARCHAR(255),
  estado       VARCHAR(20)   NOT NULL DEFAULT 'Activo',
  archivado    BOOLEAN       NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
--  CLIENTES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  id               SERIAL PRIMARY KEY,
  nombre           VARCHAR(100)  NOT NULL,
  apellido         VARCHAR(100)  NOT NULL,
  cedula           VARCHAR(20)   NOT NULL UNIQUE,
  email            VARCHAR(150)  NOT NULL UNIQUE,
  telefono         VARCHAR(20)   NOT NULL UNIQUE,
  direccion        VARCHAR(255),
  fecha_nacimiento DATE,
  sexo             CHAR(1)       CHECK (sexo IN ('M', 'F')),
  foto             VARCHAR(255),
  id_entrenador    INTEGER       REFERENCES entrenadores(id) ON DELETE SET NULL,
  estado           VARCHAR(20)   NOT NULL DEFAULT 'Activo',
  archivado        BOOLEAN       NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
