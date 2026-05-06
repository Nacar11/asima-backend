import { WalletTypeEnum } from '@/wallets/enums/wallet-type.enum';
import { WalletStatusEnum } from '@/wallets/enums/wallet-status.enum';

export class Wallet {
  id: number;
  user_id: number;
  wallet_type: WalletTypeEnum;
  seller_id: number | null;
  balance: number;
  pending_balance: number;
  total_credited: number;
  total_debited: number;
  currency_code: string;
  status: WalletStatusEnum;
  frozen_reason: string | null;
  debt_amount: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}
