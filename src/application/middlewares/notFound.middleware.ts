import { Request, Response } from 'express';

export const notFound = (request: Request, response: Response): void => {
  response.status(404).json({
    status: 'error',
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `No existe la ruta ${request.method} ${request.originalUrl}.`,
    },
  });
};
