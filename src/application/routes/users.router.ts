import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { RequestHandler } from 'express';

export const createUsersRouter = (
  controller: AuthController,
  authenticateToken: RequestHandler
) => {
  const usersRouter = Router();

  usersRouter.post('/', controller.registrarUsuario);
  usersRouter.get('/me', authenticateToken, controller.obtenerPerfil);

  return usersRouter;
};
