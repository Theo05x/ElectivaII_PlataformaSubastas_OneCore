import jwt from 'jsonwebtoken';

const JWT_SECRET: any = process.env.JWT_SECRET

export const generateToken = (payload:any) => {
    try {
        const token = jwt.sign(
            payload,
            JWT_SECRET, 
            {
                algorithm: 'HS256',
                expiresIn: '24h',
                issuer: 'auction-platform',
                audience: 'auction-platform-users'
            }
        );

        console.log('Token generado exitosamente');
        return token;

    } catch (error) {
        console.log('[Error al generar el token]');
        throw new Error("Error al generar el token");
    }
}

export const verifyToken = (token: string): any => {
   try {
     const decoded = jwt.verify(token, JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: 'auction-platform',
        audience: 'auction-platform-users'
     })
     
    return decoded;

   } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
        console.log('[ERROR JWT] token expirado', error.message)
        throw new Error ('Token expirado')
    }  else {
        console.log('[ERROR JWT] error en el token', error)
        throw new Error ('Token expirado')
    }

   } 
}

export const extractTokenFromHeader = (authHeader : string | undefined) : string | null => {
    
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return null;
    }
    
    return authHeader.substring(7);
}

