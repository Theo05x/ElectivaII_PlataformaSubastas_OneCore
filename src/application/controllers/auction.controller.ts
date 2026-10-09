import { Request, Response } from 'express';
import { subastas, categorias, pujas, pujasRechazadas } from '../data/auctionData';

export const listarCategorias = (request: Request, response: Response): void => {
};

export const crearSubasta = (request: Request, response: Response): void => {

};

export const listarSubastas = (request: Request, response: Response): void => {
 
};

export const obtenerSubastaPorId = (request: Request, response: Response): void => {
  const { id } = request.params; 
  const subasta = subastas.find(s => s.id === id);

  if (!subasta) {
    response.status(404).json({ status: "error", error: { code: "NOT_FOUND", message: "Subasta no encontrada" } });
    return;
  }

  const historialPujas = pujas.filter(b => b.auctionId === id);
  response.status(200).json({ status: "success", data: { ...subasta, bidsHistory: historialPujas } });
};

export const cancelarSubasta = (request: Request, response: Response): void => {
  const { id } = request.params;
  const subasta = subastas.find(s => s.id === id);

  if (!subasta) {
    response.status(404).json({ status: "error", error: { code: "NOT_FOUND", message: "Subasta no encontrada" } });
    return;
  }

  subasta.status = "CANCELLED";
  response.status(200).json({ status: "success", data: { message: "Subasta cancelada correctamente", auctionId: id } });
};

export const registrarPuja = (request: Request, response: Response): void => {

};

export const obtenerPujasRechazadas = (request: Request, response: Response): void => {
};