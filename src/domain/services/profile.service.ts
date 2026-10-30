import { AuctionRepository, BidRepository, UserRepository } from '../ports/repository-ports';
import { ServiceError } from './service-error';

export class ProfileService {
  constructor(
    private readonly users: UserRepository,
    private readonly auctions: AuctionRepository,
    private readonly bids: BidRepository
  ) {}

  async get(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new ServiceError('USER_NOT_FOUND', 'Usuario no encontrado.', 404);

    const [publishedAuctions, userBids] = await Promise.all([
      this.auctions.findBySeller(userId),
      this.bids.findByBidder(userId),
    ]);
    const participatedIds = [...new Set(userBids.map(bid => bid.auctionId))];
    const participatedAuctions = await this.auctions.findByIds(participatedIds);

    return {
      user: { id: user.id, name: user.name, email: user.email },
      publishedAuctions,
      participatedAuctions,
    };
  }
}
