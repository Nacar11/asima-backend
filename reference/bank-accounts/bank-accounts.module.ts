import { Module } from '@nestjs/common';
import { BankAccountsController } from './bank-accounts.controller';
import { BankAccountsService } from './bank-accounts.service';
import { BankAccountPersistenceModule } from './persistence/persistence.module';
import { EncryptionModule } from '@/utils/encryption/encryption.module';

@Module({
  imports: [BankAccountPersistenceModule, EncryptionModule],
  controllers: [BankAccountsController],
  providers: [BankAccountsService],
  exports: [BankAccountsService],
})
export class BankAccountsModule {}
