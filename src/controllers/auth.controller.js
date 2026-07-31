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

module.exports = { login };
