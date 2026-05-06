import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EscrowTransactionEntity } from './entities/escrow-transaction.entity';
import { BaseEscrowTransactionRepository } from './base-escrow-transaction.repository';
import { EscrowTransactionRepository } from './repositories/escrow-transaction.repository';
import { EscrowTransactionMapper } from './mappers/escrow-transaction.mapper';

/**
 * Escrow Transactions Persistence Module.
 *
 * Provides data access layer for escrow transactions including repository
 * implementations and TypeORM entity registration. Maps abstract repository
 * to concrete implementation for dependency injection.
 *
 * @version 1
 * @since 1.0.0
 */
@Module({
  imports: [TypeOrmModule.forFeature([EscrowTransactionEntity])],
  providers: [
    EscrowTransactionMapper,
    {
      provide: BaseEscrowTransactionRepository,
      useClass: EscrowTransactionRepository,
    },
  ],
  exports: [
    TypeOrmModule,
    BaseEscrowTransactionRepository,
    EscrowTransactionMapper,
  ],
})
export class EscrowTransactionPersistenceModule {}
