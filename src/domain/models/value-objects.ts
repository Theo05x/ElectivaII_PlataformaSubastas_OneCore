export class DomainValidationError extends Error {
  public readonly statusCode = 400;

  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'DomainValidationError';
  }
}

export class EmailAddress {
  private constructor(public readonly value: string) {
    Object.freeze(this);
  }

  static create(value: string): EmailAddress {
    const normalized = value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new DomainValidationError(
        'INVALID_EMAIL',
        'El correo electrónico no es válido.'
      );
    }
    return new EmailAddress(normalized);
  }

  equals(other: EmailAddress): boolean {
    return this.value === other.value;
  }

  toJSON(): string {
    return this.value;
  }
}

export class Money {
  private constructor(public readonly amount: number) {
    Object.freeze(this);
  }

  static create(amount: number): Money {
    if (!Number.isSafeInteger(amount) || amount < 0) {
      throw new DomainValidationError(
        'INVALID_MONEY',
        'El valor monetario debe ser un entero no negativo en COP.'
      );
    }
    return new Money(amount);
  }

  add(other: Money): Money {
    return Money.create(this.amount + other.amount);
  }

  isLessThan(other: Money): boolean {
    return this.amount < other.amount;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount;
  }

  toJSON(): number {
    return this.amount;
  }
}

export type AuctionStatusValue =
  | 'OPEN'
  | 'CLOSED'
  | 'CANCELLED'
  | 'DESIERTA'
  | 'PAID'
  | 'DEFAULTED';

export class AuctionStatus {
  private constructor(public readonly value: AuctionStatusValue) {
    Object.freeze(this);
  }

  static readonly OPEN = new AuctionStatus('OPEN');
  static readonly CLOSED = new AuctionStatus('CLOSED');
  static readonly CANCELLED = new AuctionStatus('CANCELLED');
  static readonly DESIERTA = new AuctionStatus('DESIERTA');
  static readonly PAID = new AuctionStatus('PAID');
  static readonly DEFAULTED = new AuctionStatus('DEFAULTED');
  static readonly values = Object.freeze([
    AuctionStatus.OPEN,
    AuctionStatus.CLOSED,
    AuctionStatus.CANCELLED,
    AuctionStatus.DESIERTA,
    AuctionStatus.PAID,
    AuctionStatus.DEFAULTED,
  ]);

  static from(value: string): AuctionStatus {
    const status = AuctionStatus.values.find(candidate => candidate.value === value);
    if (!status) {
      throw new DomainValidationError(
        'INVALID_STATUS',
        'El estado de subasta no es válido.'
      );
    }
    return status;
  }

  equals(other: AuctionStatus): boolean {
    return this.value === other.value;
  }

  toJSON(): AuctionStatusValue {
    return this.value;
  }
}

export type PaymentOrderStatusValue = 'PENDING' | 'PAID' | 'EXPIRED';

export class PaymentOrderStatus {
  private constructor(public readonly value: PaymentOrderStatusValue) {
    Object.freeze(this);
  }

  static readonly PENDING = new PaymentOrderStatus('PENDING');
  static readonly PAID = new PaymentOrderStatus('PAID');
  static readonly EXPIRED = new PaymentOrderStatus('EXPIRED');
  static readonly values = Object.freeze([
    PaymentOrderStatus.PENDING,
    PaymentOrderStatus.PAID,
    PaymentOrderStatus.EXPIRED,
  ]);

  static from(value: string): PaymentOrderStatus {
    const status = PaymentOrderStatus.values.find(candidate => candidate.value === value);
    if (!status) {
      throw new DomainValidationError(
        'INVALID_PAYMENT_STATUS',
        'El estado de la orden de pago no es válido.'
      );
    }
    return status;
  }

  equals(other: PaymentOrderStatus): boolean {
    return this.value === other.value;
  }

  toJSON(): PaymentOrderStatusValue {
    return this.value;
  }
}
