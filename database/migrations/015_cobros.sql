-- Migration: 015_cobros.sql
-- Description: Métodos de pago + Cobro (Proceso) — registra el pago de uno o varios cargos pendientes

CREATE TABLE IF NOT EXISTS metodos_pago (
  id         SERIAL PRIMARY KEY,
  nombre     VARCHAR(50)  NOT NULL UNIQUE,
  estado     VARCHAR(20)  NOT NULL DEFAULT 'Activo',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_metodos_pago_estado CHECK (estado IN ('Activo', 'Inactivo'))
);

INSERT INTO metodos_pago (nombre) VALUES
  ('Efectivo'), ('Tarjeta'), ('Transferencia')
ON CONFLICT (nombre) DO NOTHING;

CREATE TABLE IF NOT EXISTS cobros (
  id              SERIAL PRIMARY KEY,
  numero_cobro    VARCHAR(20)   NOT NULL UNIQUE,
  cliente_id      INTEGER       NOT NULL REFERENCES clientes(id),
  metodo_pago_id  INTEGER       NOT NULL REFERENCES metodos_pago(id),
  fecha_cobro     DATE          NOT NULL DEFAULT CURRENT_DATE,
  monto_total     NUMERIC(12,2) NOT NULL,
  estado          VARCHAR(20)   NOT NULL DEFAULT 'Completado',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_cobros_estado CHECK (estado IN ('Completado', 'Anulado'))
);

CREATE TABLE IF NOT EXISTS cobro_detalle (
  id        SERIAL PRIMARY KEY,
  cobro_id  INTEGER       NOT NULL REFERENCES cobros(id) ON DELETE CASCADE,
  cargo_id  INTEGER       REFERENCES cargos(id),
  concepto  VARCHAR(200)  NOT NULL,
  monto     NUMERIC(12,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cobros_cliente       ON cobros(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cobros_metodo_pago   ON cobros(metodo_pago_id);
CREATE INDEX IF NOT EXISTS idx_cobros_fecha         ON cobros(fecha_cobro);
CREATE INDEX IF NOT EXISTS idx_cobro_detalle_cobro  ON cobro_detalle(cobro_id);
CREATE INDEX IF NOT EXISTS idx_cobro_detalle_cargo  ON cobro_detalle(cargo_id);

INSERT INTO permisos (clave, nombre, modulo, descripcion) VALUES
  ('cobros.ver',   'Ver cobros',      'cobros', 'Listar cobros registrados'),
  ('cobros.crear', 'Registrar cobro', 'cobros', 'Registrar el pago de uno o varios cargos')
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  modulo = EXCLUDED.modulo,
  descripcion = EXCLUDED.descripcion;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'Administrador'
  AND p.clave LIKE 'cobros.%'
ON CONFLICT DO NOTHING;
