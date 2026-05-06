import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DragonPayV2Service } from '@/checkout-payments/services/dragonpay-v2.service';
import { EncryptionService } from '@/utils/encryption/encryption.service';
import { BankAccountEntity } from '@/bank-accounts/persistence/entities/bank-account.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import {
  IPayoutProvider,
  PayoutRequest,
  PayoutResult,
} from '../payout-provider.interface';

const STATUS_MAP: Record<string, PayoutResult['status']> = {
  S: 'completed',
  Q: 'processing',
  F: 'failed',
  V: 'failed',
};

@Injectable()
export class DragonPayPayoutProvider implements IPayoutProvider {
  private readonly logger = new Logger(DragonPayPayoutProvider.name);

  constructor(
    private readonly dragonPayV2Service: DragonPayV2Service,
    private readonly encryptionService: EncryptionService,
    @InjectRepository(BankAccountEntity)
    private readonly bankAccountRepository: Repository<BankAccountEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  isAvailable(): boolean {
    return this.dragonPayV2Service.isPayoutAvailable();
  }

  async dispatch(request: PayoutRequest): Promise<PayoutResult> {
    this.logger.log(
      `Dispatching payout: ref=${request.reference} amount=${request.amount} bankAccountId=${request.bankAccountId}`,
    );

    let procId: string;
    let procDetail: string;

    if (request.bankAccountId) {
      // Saved bank account flow (withdrawals)
      const bankAccount = await this.bankAccountRepository.findOne({
        where: { id: request.bankAccountId },
        relations: ['bank'],
      });
      if (!bankAccount) {
        throw new NotFoundException(
          `Bank account #${request.bankAccountId} not found`,
        );
      }
      if (!bankAccount.bank) {
        throw new NotFoundException(
          `Bank not found for bank account #${request.bankAccountId}`,
        );
      }
      procId = bankAccount.bank.bank_code;
      procDetail = this.encryptionService.decrypt(
        bankAccount.account_number_encrypted,
      );
    } else if (request.adHocProcId && request.adHocProcDetail) {
      // Ad-hoc flow (return request payouts)
      procId = request.adHocProcId;
      procDetail = request.adHocProcDetail;
    } else {
      throw new BadRequestException(
        'Either bankAccountId or adHocProcId + adHocProcDetail must be provided',
      );
    }

    // Load recipient user
    const user = await this.userRepository.findOne({
      where: { id: request.recipientUserId },
    });
    if (!user) {
      throw new NotFoundException(`User not found: ${request.recipientUserId}`);
    }

    // Dispatch to DragonPay
    let result: Awaited<
      ReturnType<typeof this.dragonPayV2Service.createPayout>
    >;
    try {
      result = await this.dragonPayV2Service.createPayout({
        firstName: user.first_name,
        lastName: user.last_name,
        amount: request.amount,
        description: request.description,
        procId,
        procDetail,
        email: user.email,
      });
    } catch (err) {
      this.logger.error(
        `DragonPay createPayout failed for ref=${request.reference}`,
        err,
      );
      throw err;
    }

    this.logger.log(
      `DragonPay payout response: txnId=${result.txnId} status=${result.status}`,
    );

    return {
      providerTxnId: result.txnId,
      status: STATUS_MAP[result.status] ?? 'processing',
      rawResponse: result,
    };
  }
}
