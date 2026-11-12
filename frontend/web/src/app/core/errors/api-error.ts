import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';
import { ApiErrorPayload } from '../api/api.models';

const guidance: Record<string, string> = {
  TOKEN_REQUIRED: 'Inicia sesión para continuar.',
  INVALID_TOKEN: 'Tu sesión venció. Inicia sesión nuevamente.',
  INVALID_CREDENTIALS: 'El correo o la contraseña no coinciden.',
  EMAIL_ALREADY_EXISTS: 'Ya existe una cuenta con ese correo.',
  AUCTION_NOT_FOUND: 'No encontramos esa subasta.',
  ORDER_NOT_FOUND: 'No encontramos esa orden de pago.',
  NOT_ORDER_OWNER: 'Solo la persona ganadora puede consultar esta orden.',
  BELOW_BASE_PRICE: 'La oferta no alcanza el precio base.',
  INSUFFICIENT_INCREMENT: 'La oferta no alcanza el incremento mínimo.',
  SELLER_CANNOT_BID: 'No puedes ofertar en tu propia subasta.',
  AUCTION_NOT_OPEN: 'Esta subasta ya no recibe ofertas.',
  AUCTION_EXPIRED: 'El plazo para ofertar ya terminó.',
  SELF_OUTBID: 'No puedes superar tu propia oferta vigente.',
  AUCTION_HAS_BIDS: 'No se puede cancelar una subasta que ya recibió ofertas.',
  NOT_AUCTION_OWNER: 'Solo quien publicó la subasta puede cancelarla.',
  DUPLICATE_RESOURCE: 'Ya existe una cuenta con esos datos.',
  INVALID_PAGINATION: 'El número de página solicitado no es válido.'
};

export class ApiError extends Error {
  constructor(message: string, readonly code = 'REQUEST_FAILED', readonly status = 0) {
    super(message);
    this.name = 'ApiError';
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof TimeoutError) {
    return new ApiError(
      'El servidor tardó más de 15 segundos en responder. Verifica que la API y MongoDB estén disponibles e intenta nuevamente.',
      'REQUEST_TIMEOUT',
      0
    );
  }
  if (error instanceof HttpErrorResponse) {
    const body = error.error as ApiErrorPayload | null;
    const code = body?.error?.code ?? 'NETWORK_ERROR';
    const serverMessage = body?.error?.message;
    const hint = guidance[code];
    const message = error.status === 0
      ? 'No fue posible conectar con OneCore. Verifica que el backend esté ejecutándose.'
      : hint && serverMessage
        ? `${hint} ${serverMessage}`
        : serverMessage || `La solicitud falló (HTTP ${error.status}).`;
    return new ApiError(message, code, error.status);
  }
  return new ApiError('Ocurrió un error inesperado. Intenta nuevamente.');
}
