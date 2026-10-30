import { model, Schema } from 'mongoose';

const pujaSchema = new Schema(
  {
    auctionId: { type: Schema.Types.ObjectId, ref: 'Subasta', required: true },
    bidderId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    amount: { type: Number, required: true, min: 1 },
    placedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const PujaModel = model('Puja', pujaSchema);
