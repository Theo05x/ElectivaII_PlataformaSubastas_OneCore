import { Request } from 'express';
import { ServiceError } from '../../domain/services/service-error';

export const requireUserId = (request: Request): string => {
  if (!request.user?.id) {
    throw new ServiceError('AUTHENTICATION_REQUIRED', 'Debes iniciar sesión.', 401);
  }
  return request.user.id;
};

export const requireText = (
  value: unknown,
  field: string
): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ServiceError('INVALID_REQUEST', `El campo ${field} es requerido.`, 400);
  }
  return value.trim();
};

export const requireObject = (
  value: unknown,
  field: string
): Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ServiceError('INVALID_REQUEST', `El campo ${field} debe ser un objeto.`, 400);
  }
  return value as Record<string, unknown>;
};

export const requirePositiveAmount = (value: unknown, field: string): number => {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new ServiceError('INVALID_REQUEST', `${field} debe ser un entero positivo en COP o mayor a 0.`, 400);
  }
  return value;
};
