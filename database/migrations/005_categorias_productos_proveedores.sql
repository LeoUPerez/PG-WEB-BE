-- Migration: 005_categorias_productos_proveedores.sql
-- Description: Inventory / maintenance tables

CREATE TABLE IF NOT EXISTS categorias (
  id             SERIAL PRIMARY KEY,
  nombre         VARCHAR(150) NOT NULL UNIQUE,
  descripcion    TEXT,
  fecha_registro DATE,
  estado         VARCHAR(20)  NOT NULL DEFAULT 'Activo',
  archivado      BOOLEAN      NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS productos (
  id             SERIAL PRIMARY KEY,
  codigo         VARCHAR(50)  NOT NULL UNIQUE,
  nombre         VARCHAR(200) NOT NULL,
  descripcion    TEXT,
  categoria_id   INTEGER      REFERENCES categorias(id) ON DELETE SET NULL,
  precio_compra  NUMERIC(12,2) NOT NULL DEFAULT 0,
  precio_venta   NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock          INTEGER       NOT NULL DEFAULT 0,
  stock_minimo   INTEGER       NOT NULL DEFAULT 0,
  imagen         VARCHAR(255),
  estado         VARCHAR(20)   NOT NULL DEFAULT 'Activo',
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proveedores (
  id         SERIAL PRIMARY KEY,
  nombre     VARCHAR(200) NOT NULL,
  rnc        VARCHAR(20),
  contacto   VARCHAR(150) NOT NULL,
  telefono   VARCHAR(20)  NOT NULL,
  correo     VARCHAR(150) NOT NULL,
  direccion  TEXT         NOT NULL,
  estado     VARCHAR(20)  NOT NULL DEFAULT 'Activo',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS proveedores_rnc_unique
  ON proveedores (rnc) WHERE rnc IS NOT NULL AND rnc <> '';

CREATE UNIQUE INDEX IF NOT EXISTS proveedores_correo_unique
  ON proveedores (correo);
