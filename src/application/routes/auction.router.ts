import { RequestHandler, Router } from 'express';
import { AuctionController } from '../controllers/auction.controller';

export const createAuctionRouter = (
  controller: AuctionController,
  authenticateToken: RequestHandler
) => {
  const auctionRouter = Router();

  auctionRouter.get('/categories', controller.listarCategorias);
  auctionRouter.post('/', authenticateToken, controller.crearSubasta);
  auctionRouter.get('/', controller.listarSubastas);
  auctionRouter.get('/:id', authenticateToken, controller.obtenerSubastaPorId);
  auctionRouter.patch('/:id', authenticateToken, controller.cancelarSubasta);
  auctionRouter.post('/:id/bids', authenticateToken, controller.registrarPuja);
  auctionRouter.get(
    '/:id/rejected-bids',
    authenticateToken,
    controller.obtenerPujasRechazadas
  );

  return auctionRouter;
};
