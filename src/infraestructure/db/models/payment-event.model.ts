import { model, Schema } from 'mongoose';

const eventoPagoSchema = new Schema(
  {
    providerEventId: { type: String, required: true, unique: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'OrdenPago', required: true },
    transactionId: { type: String, required: true },
    result: { type: String, enum: ['APPROVED', 'DECLINED'], required: true },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const EventoPagoModel = model('EventoPago', eventoPagoSchema);
