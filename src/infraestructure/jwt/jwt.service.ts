import jwt, { JwtPayload } from 'jsonwebtoken';

const getSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres.');
  }
  return secret;
};

export const validateJwtConfiguration = (): void => {
  getSecret();
};

export const generateToken = (userId: string): string =>
  jwt.sign({}, getSecret(), {
    algorithm: 'HS256',
    subject: userId,
    expiresIn: '24h',
    issuer: 'auction-platform',
    audience: 'auction-platform-users',
  });

export const verifyToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, getSecret(), {
    algorithms: ['HS256'],
    issuer: 'auction-platform',
    audience: 'auction-platform-users',
  });
  if (typeof decoded === 'string' || !decoded.sub) {
    throw new Error('Token inválido.');
  }
  return decoded;
};
