const usuarioService = require('../services/usuario.service');

const getAll = async (req, res, next) => {
  try {
    const data = await usuarioService.findAll();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await usuarioService.findById(req.params.id);
    if (!data) { res.status(404); throw new Error('Usuario no encontrado'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await usuarioService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { password_actual, password_nueva, ...campos } = req.body;

    // Handle optional password change
    if (password_nueva) {
      const existente = await usuarioService.findByUsuario(campos.usuario);
      if (!existente) { res.status(404); throw new Error('Usuario no encontrado'); }

      const bcrypt = require('bcrypt');
      const valida = await bcrypt.compare(password_actual, existente.password);
      if (!valida) { res.status(400); throw new Error('La contraseña actual es incorrecta'); }

      await usuarioService.cambiarPassword(req.params.id, password_nueva);
    }

    const data = await usuarioService.update(req.params.id, campos);
    if (!data) { res.status(404); throw new Error('Usuario no encontrado'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const cambiarEstado = async (req, res, next) => {
  try {
    const { estado } = req.body;
    const data = await usuarioService.cambiarEstado(req.params.id, estado);
    if (!data) { res.status(404); throw new Error('Usuario no encontrado'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const archivar = async (req, res, next) => {
  try {
    const data = await usuarioService.archivar(req.params.id);
    if (!data) { res.status(404); throw new Error('Usuario no encontrado'); }
    res.json({ success: true, message: 'Usuario archivado', data });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, cambiarEstado, archivar };
