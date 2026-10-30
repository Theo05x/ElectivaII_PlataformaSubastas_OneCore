import { model, Schema } from 'mongoose';

const ordenPagoSchema = new Schema(
  {
    auctionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subasta',
      required: true,
      unique: true,
    },
    winnerId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    amount: { type: Number, required: true, min: 1 },
    expirationDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'EXPIRED'],
      default: 'PENDING',
    },
    transactionId: { type: String, default: null },
  },
  { timestamps: true }
);

export const OrdenPagoModel = model('OrdenPago', ordenPagoSchema);
