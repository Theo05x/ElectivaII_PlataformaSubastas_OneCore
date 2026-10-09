import { Request, Response } from 'express';
import { usuarios } from '../data/userData'

export const registrarUsuario = (request: Request, response: Response): void => {
  
};

export const iniciarSesion = (request: Request, response: Response): void => {
  
};

export const obtenerPerfil = (request: Request, response: Response): void => {
  response.status(200).json({
    status: "success",
    data: { id: "usr_1", name: "Mateo Duque", email: "mateo@mail.com" }
  });
};