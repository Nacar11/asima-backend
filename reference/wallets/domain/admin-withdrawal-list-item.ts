export class AdminWithdrawalListItem {
  id: number;
  wallet_id: number;
  amount: number;
  processing_fee: number;
  net_amount: number;
  status: string;
  failure_reason: string | null;
  bank_reference_number: string | null;
  requested_at: Date;
  processed_at: Date | null;
  completed_at: Date | null;
  bank_account_id: number;
  bank_account: {
    id: number;
    account_holder_name: string | null;
    last_four: string | null;
    account_type?: string | null;
    bank?: { bank_name: string; bank_code: string } | null;
  } | null;
  seller: {
    id: number;
    store_name?: string | null;
    user?: { first_name: string; last_name: string; email: string } | null;
  } | null;
}
