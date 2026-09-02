import { Router } from 'express';
import { registrarUsuario, iniciarSesion, obtenerPerfil } from '../controllers/authController';

const authRouter = Router();

authRouter.post('/register', registrarUsuario);
authRouter.post('/login', iniciarSesion);
authRouter.get('/me', obtenerPerfil);

export default authRouter;