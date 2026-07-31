const pool = require('../config/db');
const bcrypt = require('bcrypt');

const login = async (usuario, password) => {
  const { rows } = await pool.query(
    'SELECT * FROM usuarios WHERE usuario = $1',
    [usuario]
  );

  if (rows.length === 0) return { ok: false, mensaje: 'Usuario o contraseña incorrectos' };

  const user = rows[0];

  if (user.archivado) return { ok: false, mensaje: 'Este usuario ha sido archivado. Contacte al administrador.' };
  if (!user.estado)   return { ok: false, mensaje: 'Este usuario está inactivo. Contacte al administrador.' };

  const passwordValida = await bcrypt.compare(password, user.password);
  if (!passwordValida) return { ok: false, mensaje: 'Usuario o contraseña incorrectos' };

  // Never return the password hash to the caller
  const { password: _, ...usuarioSeguro } = user;
  return { ok: true, usuario: usuarioSeguro };
};

module.exports = { login };
