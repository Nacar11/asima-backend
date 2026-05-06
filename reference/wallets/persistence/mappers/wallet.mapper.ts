import { Wallet } from '@/wallets/domain/wallet';
import { WalletEntity } from '@/wallets/persistence/entities/wallet.entity';
import { WalletTypeEnum } from '@/wallets/enums/wallet-type.enum';
import { WalletStatusEnum } from '@/wallets/enums/wallet-status.enum';

export class WalletMapper {
  static toDomain(raw: WalletEntity): Wallet {
    const domain = new Wallet();
    domain.id = raw.id;
    domain.user_id = raw.user_id;
    domain.wallet_type = raw.wallet_type as WalletTypeEnum;
    domain.seller_id = raw.seller_id;
    domain.balance = Number(raw.balance);
    domain.pending_balance = Number(raw.pending_balance);
    domain.total_credited = Number(raw.total_credited);
    domain.total_debited = Number(raw.total_debited);
    domain.currency_code = raw.currency_code;
    domain.status = raw.status as WalletStatusEnum;
    domain.frozen_reason = raw.frozen_reason;
    domain.debt_amount = Number(raw.debt_amount);
    domain.created_at = raw.created_at;
    domain.updated_at = raw.updated_at;
    domain.deleted_at = raw.deleted_at ?? null;
    return domain;
  }
}
