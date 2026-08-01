BEGIN;
SET search_path TO gym;
DROP TABLE IF EXISTS customer_memberships CASCADE;
DROP TABLE IF EXISTS membership_types CASCADE;
COMMIT;
