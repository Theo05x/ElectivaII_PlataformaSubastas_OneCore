import { RequestHandler } from 'express';
import { TokenService } from '../../domain/ports/repository-ports';

export const createAuthenticateToken = (
  tokens: Pick<TokenService, 'verify'>
): RequestHandler => (request, response, next) => {
  const [scheme, token] = (request.headers.authorization ?? '').split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    response.status(401).json({
      status: 'error',
      error: {
        code: 'TOKEN_REQUIRED',
        message: 'Envía el token como Authorization: Bearer <token>.',
      },
    });
    return;
  }

  try {
    const userId = tokens.verify(token);
    if (!userId) {
      response.status(401).json({
        status: 'error',
        error: { code: 'INVALID_TOKEN', message: 'El token no identifica un usuario.' },
      });
      return;
    }
    request.user = { id: userId };
    next();
  } catch {
    response.status(401).json({
      status: 'error',
      error: { code: 'INVALID_TOKEN', message: 'El token es inválido o expiró.' },
    });
  }
};
