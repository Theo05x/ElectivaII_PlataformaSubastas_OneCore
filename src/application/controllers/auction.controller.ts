import { Request, Response } from 'express';
import { AuctionStatus, Money } from '../../domain/models/value-objects';
import { AuctionService } from '../../domain/services/auction.service';
import {
  requireObject,
  requirePositiveAmount,
  requireText,
  requireUserId,
} from './request-data';
import { ServiceError } from '../../domain/services/service-error';

export const createAuctionController = (auctionService: AuctionService) => ({
  listarCategorias: async (_request: Request, response: Response) => {
    const categories = await auctionService.categories();
    response.status(200).json({ status: 'success', data: categories });
  },

  crearSubasta: async (request: Request, response: Response) => {
    const article = requireObject(request.body?.article, 'article');
    const endDate = new Date(requireText(request.body?.endDate, 'endDate'));
    if (!Number.isFinite(endDate.getTime())) {
      throw new ServiceError(
        'INVALID_REQUEST',
        'endDate debe ser una fecha válida.',
        400
      );
    }

    const auction = await auctionService.create({
      sellerId: requireUserId(request),
      article: {
        title: requireText(article.title, 'article.title'),
        description: requireText(article.description, 'article.description'),
        conservationState: requireText(
          article.conservationState,
          'article.conservationState'
        ),
      },
      category: requireText(request.body?.category, 'category'),
      basePrice: Money.create(
        requirePositiveAmount(request.body?.basePrice, 'basePrice')
      ),
      minimumIncrement: Money.create(
        requirePositiveAmount(
          request.body?.minimumIncrement,
          'minimumIncrement'
        )
      ),
      endDate,
    });
    response.status(201).json({ status: 'success', data: auction });
  },

  listarSubastas: async (request: Request, response: Response) => {
    const page = Number(request.query.page ?? 1);
    const limit = Number(request.query.limit ?? 10);
    const status = request.query.status;
    const category = request.query.category;

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(limit)
    ) {
      throw new ServiceError(
        'INVALID_PAGINATION',
        'page y limit deben ser enteros válidos.',
        400
      );
    }
    let validStatus: AuctionStatus | undefined;
    if (typeof status === 'string') {
      validStatus = AuctionStatus.from(status);
    } else if (status !== undefined) {
      throw new ServiceError(
        'INVALID_STATUS',
        'El estado de subasta no es válido.',
        400
      );
    }
    if (category !== undefined && typeof category !== 'string') {
      throw new ServiceError(
        'INVALID_CATEGORY',
        'La categoría no es válida.',
        400
      );
    }

    const auctions = await auctionService.list({
      category: typeof category === 'string' ? category : undefined,
      status: validStatus,
      skip: (page - 1) * limit,
      limit,
    });
    response.status(200).json({
      status: 'success',
      data: auctions,
      pagination: { page, limit, results: auctions.length },
    });
  },

  obtenerSubastaPorId: async (request: Request, response: Response) => {
    const auction = await auctionService.get(
      requireText(request.params.id, 'id')
    );
    const bids = await auctionService.bidHistory(auction.id);
    response.status(200).json({
      status: 'success',
      data: { ...auction, bidsHistory: bids },
    });
  },

  cancelarSubasta: async (request: Request, response: Response) => {
    if (request.body?.status !== 'CANCELLED') {
      throw new ServiceError(
        'INVALID_STATUS',
        'Para cancelar la subasta, el estado debe ser CANCELLED.',
        400
      );
    }
    const auction = await auctionService.cancel(
      requireText(request.params.id, 'id'),
      requireUserId(request)
    );
    response.status(200).json({ status: 'success', data: auction });
  },

  registrarPuja: async (request: Request, response: Response) => {
    const amount = request.body?.amount;
    if (typeof amount !== 'number') {
      throw new ServiceError(
        'INVALID_REQUEST',
        'amount debe ser un número.',
        400
      );
    }
    const bid = await auctionService.placeBid(
      requireText(request.params.id, 'id'),
      requireUserId(request),
      amount
    );
    response.status(201).json({ status: 'success', data: bid });
  },

  obtenerPujasRechazadas: async (request: Request, response: Response) => {
    const bids = await auctionService.rejectedBidHistory(
      requireText(request.params.id, 'id')
    );
    response.status(200).json({ status: 'success', data: bids });
  },
});

export type AuctionController = ReturnType<typeof createAuctionController>;
