-- Migration: 036_clases_imagen.sql
-- Description: Add optional imagen path for clases (stored on PHP disk under uploads/clases/)

ALTER TABLE clases ADD COLUMN IF NOT EXISTS imagen VARCHAR(255);
