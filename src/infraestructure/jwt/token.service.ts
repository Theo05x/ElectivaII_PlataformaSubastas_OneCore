import { TokenService } from '../../domain/ports/repository-ports';
import { generateToken, verifyToken } from './jwt.service';

export class JwtTokenService implements TokenService {
  create(userId: string): string {
    return generateToken(userId);
  }

  verify(token: string): string | null {
    return verifyToken(token).sub ?? null;
  }
}
