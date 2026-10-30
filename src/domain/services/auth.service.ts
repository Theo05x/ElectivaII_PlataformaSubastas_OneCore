import { UserRepository, PasswordService, TokenService } from '../ports/repository-ports';
import { ServiceError } from './service-error';
import {
  DomainValidationError,
  EmailAddress,
} from '../models/value-objects';

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService
  ) {}

  async register(name: string, email: string, password: string) {
    if (!name.trim() || !password) {
      throw new ServiceError(
        'INVALID_REGISTRATION',
        'Nombre, correo y contraseña válida son requeridos.',
        400
      );
    }

    const emailAddress = EmailAddress.create(email);
    if (await this.users.findByEmail(emailAddress)) {
      throw new ServiceError('EMAIL_ALREADY_EXISTS', 'El correo ya está registrado.', 409);
    }

    const user = await this.users.create({
      name: name.trim(),
      email: emailAddress,
      passwordHash: await this.passwords.hash(password),
    });

    return { id: user.id, name: user.name, email: user.email };
  }

  async login(email: string, password: string) {
    if (!email.trim() || !password) {
      throw new ServiceError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.', 401);
    }
    let emailAddress: EmailAddress;
    try {
      emailAddress = EmailAddress.create(email);
    } catch (error) {
      if (!(error instanceof DomainValidationError)) throw error;
      throw new ServiceError(
        'INVALID_CREDENTIALS',
        'Correo o contraseña incorrectos.',
        401
      );
    }
    const user = await this.users.findByEmail(emailAddress);
    if (!user || !(await this.passwords.verify(password, user.passwordHash))) {
      throw new ServiceError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.', 401);
    }

    return { token: this.tokens.create(user.id) };
  }
}
