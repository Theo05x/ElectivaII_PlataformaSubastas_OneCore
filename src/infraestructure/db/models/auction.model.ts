import { model, Schema } from 'mongoose';

const subastaSchema = new Schema(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    article: {
      title: { type: String, required: true },
      description: { type: String, required: true },
      conservationState: { type: String, required: true },
    },
    category: { type: String, required: true },
    basePrice: { type: Number, required: true, min: 1 },
    minimumIncrement: { type: Number, required: true, min: 1 },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED', 'CANCELLED', 'DESIERTA', 'PAID', 'DEFAULTED'],
      default: 'OPEN',
    },
    currentBidAmount: { type: Number, default: null, min: 1 },
    currentBidderId: { type: Schema.Types.ObjectId, ref: 'Usuario', default: null },
    winnerId: { type: Schema.Types.ObjectId, ref: 'Usuario', default: null },
    winningBidAmount: { type: Number, default: null, min: 1 },
  },
  { timestamps: true }
);

export const SubastaModel = model('Subasta', subastaSchema);
