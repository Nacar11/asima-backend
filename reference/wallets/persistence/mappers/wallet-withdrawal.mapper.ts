import { WalletWithdrawal } from '@/wallets/domain/wallet-withdrawal';
import { WalletWithdrawalEntity } from '@/wallets/persistence/entities/wallet-withdrawal.entity';
import { WithdrawalStatusEnum } from '@/wallets/enums/withdrawal-status.enum';

export class WalletWithdrawalMapper {
  static toPersistence(
    domain: WalletWithdrawal,
  ): Partial<WalletWithdrawalEntity> {
    return {
      id: domain.id,
      wallet_id: domain.wallet_id,
      wallet_transaction_id: domain.wallet_transaction_id,
      bank_account_id: domain.bank_account_id,
      amount: domain.amount,
      processing_fee: domain.processing_fee,
      net_amount: domain.net_amount,
      status: domain.status,
      failure_reason: domain.failure_reason,
      bank_reference_number: domain.bank_reference_number,
      payout_provider: domain.payout_provider,
      payout_reference: domain.payout_reference,
      payout_status: domain.payout_status,
      payout_dispatched_at: domain.payout_dispatched_at,
      requested_at: domain.requested_at,
      processed_at: domain.processed_at,
      completed_at: domain.completed_at,
      processed_by_id: domain.processed_by_id,
    };
  }

  static toDomain(raw: WalletWithdrawalEntity): WalletWithdrawal {
    const domain = new WalletWithdrawal();
    domain.id = raw.id;
    domain.wallet_id = raw.wallet_id;
    domain.wallet_transaction_id = raw.wallet_transaction_id;
    domain.bank_account_id = raw.bank_account_id;
    domain.amount = Number(raw.amount);
    domain.processing_fee = Number(raw.processing_fee);
    domain.net_amount = Number(raw.net_amount);
    domain.status = raw.status as WithdrawalStatusEnum;
    domain.failure_reason = raw.failure_reason;
    domain.bank_reference_number = raw.bank_reference_number;
    domain.payout_provider = raw.payout_provider;
    domain.payout_reference = raw.payout_reference;
    domain.payout_status = raw.payout_status;
    domain.payout_dispatched_at = raw.payout_dispatched_at;
    domain.requested_at = raw.requested_at;
    domain.processed_at = raw.processed_at;
    domain.completed_at = raw.completed_at;
    domain.processed_by_id = raw.processed_by_id;
    domain.created_at = raw.created_at;
    domain.updated_at = raw.updated_at;
    domain.deleted_at = raw.deleted_at ?? null;
    return domain;
  }
}
