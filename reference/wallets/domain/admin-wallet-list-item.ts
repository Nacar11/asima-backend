export class AdminWalletListItem {
  id: number;
  balance: number;
  pending_balance: number;
  total_credited: number;
  total_debited: number;
  debt_amount: number;
  status: string;
  frozen_reason: string | null;
  currency_code: string;
  seller_id: number | null;
  seller_store_name: string | null;
  owner_first_name: string | null;
  owner_last_name: string | null;
  owner_email: string | null;
  created_at: Date;
}
