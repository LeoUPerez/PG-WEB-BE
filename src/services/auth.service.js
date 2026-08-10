const pool = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const emailService = require('./email.service');

const RESET_TOKEN_TTL_MINUTOS = 15;

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

const solicitarRecuperacion = async (usuario) => {
  const { rows } = await pool.query(
    'SELECT * FROM usuarios WHERE usuario = $1',
    [usuario]
  );

  if (rows.length === 0) return { ok: false, mensaje: 'No existe un usuario con ese nombre de usuario' };

  const user = rows[0];
  if (user.archivado) return { ok: false, mensaje: 'Este usuario ha sido archivado. Contacte al administrador.' };
  if (!user.estado)   return { ok: false, mensaje: 'Este usuario está inactivo. Contacte al administrador.' };

  const token = crypto.randomInt(100000, 1000000).toString();
  const expiraEn = new Date(Date.now() + RESET_TOKEN_TTL_MINUTOS * 60 * 1000);

  await pool.query(
    'INSERT INTO password_resets (usuario_id, token, expira_en) VALUES ($1, $2, $3)',
    [user.id, token, expiraEn]
  );

  // Si hay correo, intenta enviarlo por SendGrid. Si no hay correo o el envío falla,
  // se hace fallback a mostrar el código directo en pantalla (no depende de Internet).
  if (user.email) {
    try {
      await emailService.enviarCodigoRecuperacion({
        destinatario: user.email,
        nombre: user.nombre,
        usuario: user.usuario,
        token,
        ttlMinutos: RESET_TOKEN_TTL_MINUTOS,
      });
      const emailOculto = user.email.replace(/^(.{2}).+(@.+)$/, '$1***$2');
      return { ok: true, email_oculto: emailOculto, ttl_minutos: RESET_TOKEN_TTL_MINUTOS };
    } catch (err) {
      // Fallback silencioso: continúa abajo y devuelve el token en pantalla
    }
  }

  return { ok: true, token, ttl_minutos: RESET_TOKEN_TTL_MINUTOS };
};

const restablecerPassword = async (usuario, token, nuevaPassword) => {
  const { rows: usuarios } = await pool.query(
    'SELECT * FROM usuarios WHERE usuario = $1',
    [usuario]
  );
  if (usuarios.length === 0) return { ok: false, mensaje: 'Código inválido o expirado' };
  const user = usuarios[0];

  const { rows } = await pool.query(
    `SELECT * FROM password_resets
     WHERE usuario_id = $1 AND token = $2 AND usado = false AND expira_en > NOW()
     ORDER BY id DESC LIMIT 1`,
    [user.id, token]
  );
  if (rows.length === 0) return { ok: false, mensaje: 'Código inválido o expirado' };

  const reset = rows[0];
  const hash = await bcrypt.hash(nuevaPassword, 10);

  await pool.query('UPDATE usuarios SET password = $1, updated_at = NOW() WHERE id = $2', [hash, user.id]);
  await pool.query('UPDATE password_resets SET usado = true WHERE id = $1', [reset.id]);

  return { ok: true };
};

module.exports = { login, solicitarRecuperacion, restablecerPassword };
