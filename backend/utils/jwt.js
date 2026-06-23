import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const generarToken = (usuario) => {
  return jwt.sign(
    { id: usuario._id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre },
    env.jwtSecret,
    { expiresIn: '24h' }
  );
};

export const verificarToken = (token) => {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch (error) {
    return null;
  }
};
