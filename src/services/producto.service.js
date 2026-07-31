const pool = require('../config/db');

const findAll = async () => {
  const { rows } = await pool.query(
    `SELECT p.*, c.nombre AS categoria_nombre
     FROM productos p
     LEFT JOIN categorias c ON c.id = p.categoria_id
     ORDER BY p.id DESC`
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(
    `SELECT p.*, c.nombre AS categoria_nombre
     FROM productos p
     LEFT JOIN categorias c ON c.id = p.categoria_id
     WHERE p.id = $1`,
    [id]
  );
  return rows[0] || null;
};

const create = async ({
  codigo,
  nombre,
  descripcion,
  categoria_id,
  precio_compra = 0,
  precio_venta = 0,
  stock = 0,
  stock_minimo = 0,
  imagen,
  estado = 'Activo',
}) => {
  const { rows } = await pool.query(
    `INSERT INTO productos
       (codigo, nombre, descripcion, categoria_id, precio_compra, precio_venta,
        stock, stock_minimo, imagen, estado)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      codigo,
      nombre,
      descripcion || null,
      categoria_id || null,
      precio_compra,
      precio_venta,
      stock,
      stock_minimo,
      imagen || null,
      estado,
    ]
  );
  return rows[0];
};

const update = async (id, {
  codigo,
  nombre,
  descripcion,
  categoria_id,
  precio_compra,
  precio_venta,
  stock,
  stock_minimo,
  imagen,
  estado,
}) => {
  const { rows } = await pool.query(
    `UPDATE productos
     SET codigo = $1, nombre = $2, descripcion = $3, categoria_id = $4,
         precio_compra = $5, precio_venta = $6, stock = $7, stock_minimo = $8,
         imagen = $9, estado = $10, updated_at = NOW()
     WHERE id = $11
     RETURNING *`,
    [
      codigo,
      nombre,
      descripcion || null,
      categoria_id || null,
      precio_compra,
      precio_venta,
      stock,
      stock_minimo,
      imagen || null,
      estado,
      id,
    ]
  );
  return rows[0] || null;
};

module.exports = { findAll, findById, create, update };
