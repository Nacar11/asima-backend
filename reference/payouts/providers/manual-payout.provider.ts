import { Injectable } from '@nestjs/common';
import {
  IPayoutProvider,
  PayoutRequest,
  PayoutResult,
} from '../payout-provider.interface';

@Injectable()
export class ManualPayoutProvider implements IPayoutProvider {
  isAvailable(): boolean {
    return true;
  }

  dispatch(request: PayoutRequest): Promise<PayoutResult> {
    return Promise.resolve({
      providerTxnId: `MANUAL-${request.reference}`,
      status: 'pending',
    });
  }
}
