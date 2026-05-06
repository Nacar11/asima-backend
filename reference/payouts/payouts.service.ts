import {
  Injectable,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  IPayoutProvider,
  PayoutRequest,
  PayoutResult,
  PAYOUT_PROVIDER_TOKEN,
} from './payout-provider.interface';

@Injectable()
export class PayoutsService {
  constructor(
    @Inject(PAYOUT_PROVIDER_TOKEN)
    private readonly provider: IPayoutProvider,
  ) {}

  async dispatchPayout(request: PayoutRequest): Promise<PayoutResult> {
    if (!this.provider.isAvailable()) {
      throw new ServiceUnavailableException(
        'Payout provider is not configured or unavailable.',
      );
    }
    return this.provider.dispatch(request);
  }
}
