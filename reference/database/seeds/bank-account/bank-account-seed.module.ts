import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankAccountEntity } from '@/bank-accounts/persistence/entities/bank-account.entity';
import { BankEntity } from '@/banks/persistence/entities/bank.entity';
import { BankAccountSeedService } from '@/database/seeds/bank-account/bank-account-seed.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { EncryptionModule } from '@/utils/encryption/encryption.module';

/**
 * Seed module for bank accounts
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([BankAccountEntity, BankEntity, UserEntity]),
    EncryptionModule,
  ],
  providers: [BankAccountSeedService],
  exports: [BankAccountSeedService],
})
export class BankAccountSeedModule {}
