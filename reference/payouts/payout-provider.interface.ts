export interface PayoutRequest {
  reference: string;
  amount: number;
  recipientUserId: number;
  description: string;
  notes?: string;
  // Option A: saved bank account (withdrawal flow)
  bankAccountId?: number;
  // Option B: ad-hoc (return request — customer-entered processor details)
  adHocProcId?: string;
  adHocProcDetail?: string;
}

export interface PayoutResult {
  providerTxnId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  rawResponse?: unknown;
}

export interface IPayoutProvider {
  isAvailable(): boolean;
  dispatch(request: PayoutRequest): Promise<PayoutResult>;
}

export const PAYOUT_PROVIDER_TOKEN = 'PAYOUT_PROVIDER';
