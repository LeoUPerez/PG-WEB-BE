-- Migration: 010_membresias_destacado.sql
-- Description: Adds a "Popular/Destacado" flag to membresias, settable at
-- create/edit time from the frontend.

ALTER TABLE membresias
  ADD COLUMN IF NOT EXISTS destacado BOOLEAN NOT NULL DEFAULT false;
