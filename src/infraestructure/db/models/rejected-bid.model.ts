import { model, Schema } from 'mongoose';

const intentoPujaRechazadoSchema = new Schema(
  {
    auctionId: { type: Schema.Types.ObjectId, ref: 'Subasta', required: true },
    bidderId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    attemptedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const IntentoPujaRechazadoModel = model(
  'IntentoPujaRechazado',
  intentoPujaRechazadoSchema
);
