import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { PasswordService } from '../../domain/ports/repository-ports';

const scrypt = promisify(scryptCallback);

export class ScryptPasswordService implements PasswordService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const hash = (await scrypt(password, salt, 64)) as Buffer;
    return `${salt}:${hash.toString('hex')}`;
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    const [salt, savedHash] = passwordHash.split(':');
    if (!salt || !savedHash) return false;

    const hash = (await scrypt(password, salt, 64)) as Buffer;
    const expected = Buffer.from(savedHash, 'hex');
    return expected.length === hash.length && timingSafeEqual(expected, hash);
  }
}
