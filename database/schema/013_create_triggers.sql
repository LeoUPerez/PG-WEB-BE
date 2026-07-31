-- =============================================================
-- 013_create_triggers.sql
-- Shared updated_at maintenance
-- =============================================================
BEGIN;

CREATE SCHEMA IF NOT EXISTS gym;
SET search_path TO gym;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'roles', 'permissions', 'role_permissions', 'users', 'user_roles',
    'customers', 'trainers',
    'membership_types', 'customer_memberships',
    'classes', 'class_schedules', 'class_reservations', 'attendances',
    'product_categories', 'products', 'suppliers',
    'purchases', 'purchase_details', 'sales', 'sale_details',
    'inventory_stock', 'inventory_movements',
    'charge_types', 'charges',
    'payment_methods', 'payments', 'payment_details'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at
         BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t, t
    );
  END LOOP;
END $$;

COMMIT;
