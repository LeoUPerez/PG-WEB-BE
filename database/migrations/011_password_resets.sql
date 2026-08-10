-- Migration: 011_password_resets.sql
-- Description: Password recovery tokens (código mostrado en pantalla, sin depender de correo)

CREATE TABLE IF NOT EXISTS password_resets (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token       VARCHAR(10)  NOT NULL UNIQUE,
  expira_en   TIMESTAMPTZ  NOT NULL,
  usado       BOOLEAN      NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token      ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_usuario_id ON password_resets(usuario_id);
