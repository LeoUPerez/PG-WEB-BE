-- =============================================================
-- Migration: 001_initial_schema.sql
-- Description: Base schema — roles, permisos, rol_permisos, usuarios
-- =============================================================

-- ─────────────────────────────────────────
--  ROLES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  estado      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
--  PERMISOS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permisos (
  id     SERIAL PRIMARY KEY,
  clave  VARCHAR(100) NOT NULL UNIQUE  -- e.g. "clientes.ver", "usuarios.crear"
);

-- ─────────────────────────────────────────
--  ROL_PERMISOS  (pivot)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rol_permisos (
  rol_id     INTEGER NOT NULL REFERENCES roles(id)    ON DELETE CASCADE,
  permiso_id INTEGER NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
  PRIMARY KEY (rol_id, permiso_id)
);

-- ─────────────────────────────────────────
--  USUARIOS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id         SERIAL PRIMARY KEY,
  usuario    VARCHAR(100) NOT NULL UNIQUE,
  nombre     VARCHAR(255) NOT NULL,
  password   VARCHAR(255) NOT NULL,          -- bcrypt hash
  rol        VARCHAR(100) NOT NULL,           -- matches roles.nombre
  estado     BOOLEAN NOT NULL DEFAULT true,
  archivado  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
