import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

export const createSessionsRouter = (controller: AuthController) => {
  const sessionsRouter = Router();

  sessionsRouter.post('/', controller.iniciarSesion);

  return sessionsRouter;
};
