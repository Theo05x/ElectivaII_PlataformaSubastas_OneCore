import { createHmac, timingSafeEqual } from 'node:crypto';
import { PaymentSignatureVerifier } from '../../domain/ports/repository-ports';

export class HmacPaymentSignatureVerifier implements PaymentSignatureVerifier {
  constructor(private readonly secret: string) {
    if (secret.length < 32) {
      throw new Error('PAYMENT_WEBHOOK_SECRET debe tener al menos 32 caracteres.');
    }
  }

  verify(payload: string, signature: string): boolean {
    if (!/^[\da-f]{64}$/i.test(signature)) return false;
    const expected = createHmac('sha256', this.secret).update(payload).digest();
    const received = Buffer.from(signature, 'hex');
    return received.length === expected.length && timingSafeEqual(received, expected);
  }
}
