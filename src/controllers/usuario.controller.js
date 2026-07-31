const bcrypt = require('bcrypt');
const usuarioService = require('../services/usuario.service');

const getAll = async (req, res, next) => {
  try {
    const archived = req.query.archived === 'true';
    const data = await usuarioService.findAll({ archived });
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
    const { password_actual, password_nueva, ...fields } = req.body;

    if (password_nueva) {
      const existing = await usuarioService.findByUsername(fields.usuario);
      if (!existing) { res.status(404); throw new Error('Usuario no encontrado'); }

      const valid = await bcrypt.compare(password_actual, existing.password);
      if (!valid) { res.status(400); throw new Error('La contraseña actual es incorrecta'); }

      await usuarioService.changePassword(req.params.id, password_nueva);
    }

    const data = await usuarioService.update(req.params.id, fields);
    if (!data) { res.status(404); throw new Error('Usuario no encontrado'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const toggleStatus = async (req, res, next) => {
  try {
    const { estado } = req.body;
    const data = await usuarioService.toggleStatus(req.params.id, estado);
    if (!data) { res.status(404); throw new Error('Usuario no encontrado'); }
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const archive = async (req, res, next) => {
  try {
    const data = await usuarioService.archive(req.params.id);
    if (!data) { res.status(404); throw new Error('Usuario no encontrado'); }
    res.json({ success: true, message: 'Usuario archivado', data });
  } catch (err) { next(err); }
};

const unarchive = async (req, res, next) => {
  try {
    const data = await usuarioService.unarchive(req.params.id);
    if (!data) { res.status(404); throw new Error('Usuario no encontrado'); }
    res.json({ success: true, message: 'Usuario restaurado', data });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, toggleStatus, archive, unarchive };
