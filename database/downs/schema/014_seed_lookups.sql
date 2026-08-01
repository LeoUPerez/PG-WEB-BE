BEGIN;
SET search_path TO gym;

DELETE FROM user_roles;
DELETE FROM role_permissions;
DELETE FROM users WHERE username = 'admin';
DELETE FROM permissions;
DELETE FROM roles WHERE name = 'Administrador';
DELETE FROM charge_types;
DELETE FROM payment_methods;

COMMIT;
