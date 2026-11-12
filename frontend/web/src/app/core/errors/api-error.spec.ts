import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';
import { toApiError } from './api-error';

describe('toApiError', () => {
  it('keeps the backend explanation and gives a business-rule hint', () => {
    const error = toApiError(new HttpErrorResponse({
      status: 409,
      error: { status: 'error', error: { code: 'INSUFFICIENT_INCREMENT', message: 'El incremento no es suficiente.' } }
    }));

    expect(error.code).toBe('INSUFFICIENT_INCREMENT');
    expect(error.message).toContain('incremento mínimo');
    expect(error.message).toContain('El incremento no es suficiente.');
  });

  it('explains an unavailable API without exposing implementation details', () => {
    const error = toApiError(new HttpErrorResponse({ status: 0 }));
    expect(error.message).toContain('Verifica que el backend');
  });

  it('explains when an API request exceeds its response deadline', () => {
    const error = toApiError(new TimeoutError());

    expect(error.code).toBe('REQUEST_TIMEOUT');
    expect(error.message).toContain('15 segundos');
  });
});
