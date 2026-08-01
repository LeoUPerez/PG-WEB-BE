BEGIN;
DELETE FROM usuarios WHERE usuario = 'admin';
DELETE FROM roles WHERE nombre = 'Administrador';
COMMIT;
