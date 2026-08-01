BEGIN;
SET search_path TO gym;
DROP TABLE IF EXISTS inventory_movements CASCADE;
DROP TABLE IF EXISTS inventory_stock CASCADE;
COMMIT;
