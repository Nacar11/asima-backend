import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrencyEntity } from '@/currencies/persistence/entities/currency.entity';
import { CurrenciesSeedService } from '@/database/seeds/currencies/currencies-seed.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Seed module for currencies
 */
@Module({
  imports: [TypeOrmModule.forFeature([CurrencyEntity, UserEntity])],
  providers: [CurrenciesSeedService],
  exports: [CurrenciesSeedService],
})
export class CurrenciesSeedModule {}
