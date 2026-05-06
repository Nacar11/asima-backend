import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankAccountEntity } from './entities/bank-account.entity';
import { BankAccountRepository } from './repositories/bank-account.repository';
import { BaseBankAccountRepository } from './base-bank-account.repository';

@Module({
  imports: [TypeOrmModule.forFeature([BankAccountEntity])],
  providers: [
    {
      provide: BaseBankAccountRepository,
      useClass: BankAccountRepository,
    },
  ],
  exports: [BaseBankAccountRepository],
})
export class BankAccountPersistenceModule {}
