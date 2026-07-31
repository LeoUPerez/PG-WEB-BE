-- =============================================================
-- 001_create_auth.sql
-- Auth: roles, permissions, users, and M:N bridges
-- =============================================================
BEGIN;

CREATE SCHEMA IF NOT EXISTS gym;
SET search_path TO gym;

CREATE TABLE roles (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_roles_name UNIQUE (name)
);

CREATE TABLE permissions (
  id          BIGSERIAL PRIMARY KEY,
  code        VARCHAR(100) NOT NULL,
  name        VARCHAR(150) NOT NULL,
  module      VARCHAR(50)  NOT NULL,
  description TEXT,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_permissions_code UNIQUE (code)
);

CREATE TABLE role_permissions (
  id            BIGSERIAL PRIMARY KEY,
  role_id       BIGINT    NOT NULL,
  permission_id BIGINT    NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_role_permissions UNIQUE (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role
    FOREIGN KEY (role_id) REFERENCES roles(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_permission
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  username      VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(200) NOT NULL,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMP,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_users_username UNIQUE (username),
  CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE TABLE user_roles (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT    NOT NULL,
  role_id     BIGINT    NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  assigned_by BIGINT,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_roles UNIQUE (user_id, role_id),
  CONSTRAINT fk_user_roles_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role
    FOREIGN KEY (role_id) REFERENCES roles(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_user_roles_assigned_by
    FOREIGN KEY (assigned_by) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_permissions_module ON permissions(module);

COMMIT;
