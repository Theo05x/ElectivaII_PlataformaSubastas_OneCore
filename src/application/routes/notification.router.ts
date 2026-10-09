    import { Router } from 'express';
    import { listarNotificaciones } from '../controllers/notification.controller';

    const notificationRouter = Router();

    notificationRouter.get('/', listarNotificaciones);

    export default notificationRouter;