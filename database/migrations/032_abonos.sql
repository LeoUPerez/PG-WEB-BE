-- Migration: 032_abonos.sql
-- Description: Pagos parciales (abonos) contra cargos pendientes

CREATE TABLE IF NOT EXISTS abonos (
  id              SERIAL PRIMARY KEY,
  numero_abono    VARCHAR(20) NOT NULL UNIQUE,
  cargo_id        INTEGER NOT NULL,
  cliente_id      INTEGER NOT NULL,
  metodo_pago_id  INTEGER NOT NULL,
  monto           NUMERIC(12,2) NOT NULL,
  fecha_abono     DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by      INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_abonos_monto CHECK (monto > 0),
  CONSTRAINT fk_abonos_cargo
    FOREIGN KEY (cargo_id) REFERENCES cargos(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_abonos_cliente
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_abonos_metodo_pago
    FOREIGN KEY (metodo_pago_id) REFERENCES metodos_pago(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_abonos_created_by
    FOREIGN KEY (created_by) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_abonos_cargo ON abonos(cargo_id);
CREATE INDEX IF NOT EXISTS idx_abonos_cliente ON abonos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_abonos_fecha ON abonos(fecha_abono);

INSERT INTO permisos (clave, nombre, modulo, descripcion) VALUES
  ('abonos.ver',       'Ver abonos',       'abonos', 'Consultar abonos y cuentas por cobrar'),
  ('abonos.registrar', 'Registrar abonos', 'abonos', 'Registrar pagos parciales contra cargos pendientes')
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  modulo = EXCLUDED.modulo,
  descripcion = EXCLUDED.descripcion;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre IN ('Administrador', 'Recepcionista')
  AND p.clave IN ('abonos.ver', 'abonos.registrar')
ON CONFLICT DO NOTHING;
