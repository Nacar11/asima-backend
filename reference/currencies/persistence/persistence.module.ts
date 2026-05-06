import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrencyEntity } from '@/currencies/persistence/entities/currency.entity';
import { BaseCurrencyRepository } from '@/currencies/persistence/base-currency.repository';
import { CurrencyRepository } from '@/currencies/persistence/repositories/currency.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CurrencyEntity])],
  providers: [
    {
      provide: BaseCurrencyRepository,
      useClass: CurrencyRepository,
    },
  ],
  exports: [BaseCurrencyRepository],
})
export class CurrencyPersistenceModule {}
