import { Module } from '@nestjs/common';
import { CurrenciesService } from '@/currencies/currencies.service';
import { CurrenciesController } from '@/currencies/currencies.controller';
import { CurrencyPersistenceModule } from '@/currencies/persistence/persistence.module';

@Module({
  imports: [CurrencyPersistenceModule],
  controllers: [CurrenciesController],
  providers: [CurrenciesService],
  exports: [CurrenciesService, CurrencyPersistenceModule],
})
export class CurrenciesModule {}
