import { env } from './env.js';

const allowedOrigins = env.frontendOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const corsOptions = {
  origin: allowedOrigins,
  credentials: true
};

export const cookieOptions = {
  httpOnly: true,
  // SameSite=None supports cross-site production deployments; CSRF protection is deferred.
  sameSite: env.jwtCookieSameSite,
  secure: env.isProduction,
  maxAge: env.jwtCookieMaxAgeMs
};

export { allowedOrigins };
