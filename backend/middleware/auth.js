import { verificarToken } from '../utils/jwt.js';

export const protegerRuta = (req, res, next) => {
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ error: 'No autorizado - No hay token' });
  }

  const usuario = verificarToken(token);
  if (!usuario) {
    return res.status(401).json({ error: 'No autorizado - Token inválido o expirado' });
  }

  req.usuario = usuario;
  next();
};

export const soloAdmin = (req, res, next) => {
  if (!req.usuario || req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Prohibido - Se requiere rol de administrador' });
  }
  next();
};
