import express from 'express';
import bcrypt from 'bcrypt';
import Usuario from '../models/Usuario.js';
import { generarToken } from '../utils/jwt.js';
import { protegerRuta } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const usuario = await Usuario.findOne({ email: email.toLowerCase(), activo: true });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = generarToken(usuario);
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Desactivado para local dev HTTP
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    });

    usuario.ultimo_login = new Date();
    await usuario.save();

    res.json({
      ok: true,
      usuario: {
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error del servidor al intentar ingresar' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    sameSite: 'strict'
  });
  res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', protegerRuta, (req, res) => {
  res.json({
    ok: true,
    usuario: req.usuario
  });
});

export default router;
