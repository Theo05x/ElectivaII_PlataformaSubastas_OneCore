    import { Router } from 'express';
    import { listarNotificaciones } from '../controllers/notificationController';

    const notificationRouter = Router();

    notificationRouter.get('/', listarNotificaciones);

    export default notificationRouter;