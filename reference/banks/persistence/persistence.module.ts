import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankEntity } from '@/banks/persistence/entities/bank.entity';
import { BankRepository } from '@/banks/persistence/repositories/bank.repository';
import { BaseBankRepository } from '@/banks/persistence/base-bank.repository';

/**
 * Persistence module for banks
 */
@Module({
  imports: [TypeOrmModule.forFeature([BankEntity])],
  providers: [
    {
      provide: BaseBankRepository,
      useClass: BankRepository,
    },
    BankRepository,
  ],
  exports: [BaseBankRepository, BankRepository],
})
export class BankPersistenceModule {}
