import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ISeedService } from '../seed.interface';
import { Repository } from 'typeorm';
import { BankAccountEntity } from '@/bank-accounts/persistence/entities/bank-account.entity';
import { BankEntity } from '@/banks/persistence/entities/bank.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { EncryptionService } from '@/utils/encryption/encryption.service';

/**
 * Service for seeding bank accounts
 */
@Injectable()
export class BankAccountSeedService implements ISeedService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(BankAccountEntity)
    private repository: Repository<BankAccountEntity>,
    @InjectRepository(BankEntity)
    private bankRepository: Repository<BankEntity>,
    private encryptionService: EncryptionService,
  ) {}

  async run(): Promise<void> {
    const user1 = await this.userRepository.findOne({ where: { id: 1 } });
    const user2 = await this.userRepository.findOne({ where: { id: 2 } });
    const user3 = await this.userRepository.findOne({ where: { id: 3 } });
    if (!user1) {
      console.error(
        '❌ User 1 (Super Admin) not found. Cannot seed bank accounts.',
      );
      return;
    }
    if (!user2) {
      console.error(
        '❌ User 2 (John Doe) not found. Cannot seed bank accounts.',
      );
      return;
    }
    if (!user3) {
      console.error(
        '❌ User 3 (Jane Smith) not found. Cannot seed bank accounts.',
      );
      return;
    }
    type BankAccountInput = {
      readonly user_id: number;
      readonly bank_code: string;
      readonly account_holder_name: string;
      readonly account_number: string;
      readonly account_type: string;
      readonly is_default: boolean;
      readonly status: string;
    };
    const ensureBankAccount = async (
      input: BankAccountInput,
      createdBy: UserEntity,
    ): Promise<BankAccountEntity | null> => {
      const bank = await this.bankRepository.findOne({
        where: { bank_code: input.bank_code },
      });
      if (!bank) {
        console.error(`❌ Bank with code ${input.bank_code} not found.`);
        return null;
      }
      const lastFour = input.account_number.slice(-4);
      const existing = await this.repository.findOne({
        where: {
          user_id: input.user_id,
          bank_id: bank.id,
          last_four: lastFour,
        },
      });
      if (existing) {
        return existing;
      }
      const encryptedAccountNumber = this.encryptionService.encrypt(
        input.account_number,
      );
      const verifiedAt = input.status === 'verified' ? new Date() : null;
      return this.repository.save(
        this.repository.create({
          user_id: input.user_id,
          bank_id: bank.id,
          account_holder_name: input.account_holder_name,
          account_number_encrypted: encryptedAccountNumber,
          last_four: lastFour,
          account_type: input.account_type,
          is_default: input.is_default,
          status: input.status,
          verified_at: verifiedAt,
          created_by: createdBy,
          updated_by: createdBy,
        }),
      );
    };
    const bankAccounts: Array<{
      input: BankAccountInput;
      createdBy: UserEntity;
    }> = [
      {
        input: {
          user_id: user1.id,
          bank_code: 'UBP',
          account_holder_name: 'Super Admin',
          account_number: '109208012345',
          account_type: 'Savings',
          is_default: true,
          status: 'verified',
        },
        createdBy: user1,
      },
      {
        input: {
          user_id: user1.id,
          bank_code: 'BPI',
          account_holder_name: 'Super Admin',
          account_number: '1234567890',
          account_type: 'Savings',
          is_default: false,
          status: 'active',
        },
        createdBy: user1,
      },
      {
        input: {
          user_id: user2.id,
          bank_code: 'BDO',
          account_holder_name: 'John Doe',
          account_number: '0012345678',
          account_type: 'Savings',
          is_default: true,
          status: 'verified',
        },
        createdBy: user2,
      },
      {
        input: {
          user_id: user2.id,
          bank_code: 'UBP',
          account_holder_name: 'John Doe',
          account_number: '109208098765',
          account_type: 'Savings',
          is_default: false,
          status: 'active',
        },
        createdBy: user2,
      },
      {
        input: {
          user_id: user3.id,
          bank_code: 'GCASH',
          account_holder_name: 'Jane Smith',
          account_number: '09171234567',
          account_type: 'Savings',
          is_default: true,
          status: 'verified',
        },
        createdBy: user3,
      },
    ];
    let createdCount = 0;
    for (const { input, createdBy } of bankAccounts) {
      const bank = await this.bankRepository.findOne({
        where: { bank_code: input.bank_code },
      });
      if (!bank) {
        continue;
      }
      const existing = await this.repository.findOne({
        where: {
          user_id: input.user_id,
          bank_id: bank.id,
          last_four: input.account_number.slice(-4),
        },
      });
      if (!existing) {
        await ensureBankAccount(input, createdBy);
        createdCount++;
      }
    }
    console.log(
      `✅ Bank accounts seed completed (${bankAccounts.length} defined, ${createdCount} inserted)`,
    );
  }
}
