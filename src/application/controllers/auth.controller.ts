import { Request, Response } from 'express';
import { AuthService } from '../../domain/services/auth.service';
import { ProfileService } from '../../domain/services/profile.service';
import { requireText, requireUserId } from './request-data';

export const createAuthController = (
  authService: AuthService,
  profileService: ProfileService
) => ({
  registrarUsuario: async (request: Request, response: Response) => {
    const user = await authService.register(
      requireText(request.body?.name, 'name'),
      requireText(request.body?.email, 'email'),
      requireText(request.body?.password, 'password')
    );
    response.status(201).json({ status: 'success', data: user });
  },

  iniciarSesion: async (request: Request, response: Response) => {
    const result = await authService.login(
      requireText(request.body?.email, 'email'),
      requireText(request.body?.password, 'password')
    );
    response.status(200).json({ status: 'success', data: result });
  },

  obtenerPerfil: async (request: Request, response: Response) => {
    const userId = requireUserId(request);
    const profile = await profileService.get(userId);
    response.status(200).json({ status: 'success', data: profile });
  },
});

export type AuthController = ReturnType<typeof createAuthController>;
