import { Request, Response, NextFunction } from "express";
import { extractTokenFromHeader } from "../../infraestructure/jwt/jwt.service";


export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {

    try {
        const authHeader = req.headers['authorization']; 
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
            return res.status(401).json({
                error: 'Token de acceso requerido',
                message: 'Debes ingresar un token valido en el header Authorization'
            });  
        }

        const payload = null;
        

    } catch (error) {
        
    }
}