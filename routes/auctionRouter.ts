import { Router } from 'express';
import { 
  listarCategorias, 
  crearSubasta, 
  listarSubastas, 
  obtenerSubastaPorId, 
  cancelarSubasta, 
  registrarPuja, 
  obtenerPujasRechazadas 
} from '../controllers/auctionController';

const auctionRouter = Router();

auctionRouter.get('/categories', listarCategorias);
auctionRouter.post('/', crearSubasta);
auctionRouter.get('/', listarSubastas);
auctionRouter.get('/:id', obtenerSubastaPorId);
auctionRouter.post('/:id/cancel', cancelarSubasta);
auctionRouter.post('/:id/bids', registrarPuja);
auctionRouter.get('/:id/rejected-bids', obtenerPujasRechazadas);

export default auctionRouter;
