BEGIN;
SET search_path TO gym;

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
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I', t, t);
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS set_updated_at();

COMMIT;
