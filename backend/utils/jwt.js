import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecrettoken1234!';

export const generarToken = (usuario) => {
  return jwt.sign(
    { id: usuario._id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

export const verificarToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
