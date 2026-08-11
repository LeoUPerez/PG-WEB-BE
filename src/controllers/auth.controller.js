const authService = require('../services/auth.service');

const login = async (req, res, next) => {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({ ok: false, mensaje: 'Usuario y contraseña son requeridos' });
    }

    const resultado = await authService.login(usuario, password);

    if (!resultado.ok) {
      return res.status(401).json({ ok: false, mensaje: resultado.mensaje });
    }

    res.json({ ok: true, usuario: resultado.usuario });
  } catch (err) {
    next(err);
  }
};

const solicitarRecuperacion = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ ok: false, mensaje: 'El correo es requerido' });
    }

    const resultado = await authService.solicitarRecuperacion(email);

    if (!resultado.ok) {
      return res.status(404).json({ ok: false, mensaje: resultado.mensaje });
    }

    res.json({
      ok: true,
      email_oculto: resultado.email_oculto,
      token: resultado.token,
      ttl_minutos: resultado.ttl_minutos,
    });
  } catch (err) {
    next(err);
  }
};

const verificarCodigo = async (req, res, next) => {
  try {
    const { email, token } = req.body;
    if (!email || !token) {
      return res.status(400).json({ ok: false, mensaje: 'Correo y código son requeridos' });
    }

    const resultado = await authService.verificarCodigo(email, token);
    if (!resultado.ok) {
      return res.status(400).json({ ok: false, mensaje: resultado.mensaje });
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

const restablecerPassword = async (req, res, next) => {
  try {
    const { email, token, password } = req.body;
    if (!email || !token || !password) {
      return res.status(400).json({ ok: false, mensaje: 'Correo, código y nueva contraseña son requeridos' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ ok: false, mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const resultado = await authService.restablecerPassword(email, token, password);
    if (!resultado.ok) {
      return res.status(400).json({ ok: false, mensaje: resultado.mensaje });
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, solicitarRecuperacion, verificarCodigo, restablecerPassword };
