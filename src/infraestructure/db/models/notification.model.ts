import { model, Schema } from 'mongoose';

const notificacionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    type: {
      type: String,
      enum: [
        'BID_OUTBID',
        'AUCTION_WON',
        'AUCTION_CLOSED',
        'PAYMENT_CONFIRMED',
        'PAYMENT_EXPIRED',
      ],
      required: true,
    },
    auctionId: { type: Schema.Types.ObjectId, ref: 'Subasta', default: null },
    orderId: { type: Schema.Types.ObjectId, ref: 'OrdenPago', default: null },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const NotificacionModel = model('Notificacion', notificacionSchema);
