-- Migration: 012_usuarios_email.sql
-- Description: Correo del usuario, usado para enviar el código de recuperación de contraseña

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email VARCHAR(150);

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_unique
  ON usuarios (email) WHERE email IS NOT NULL AND email <> '';
