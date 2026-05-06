import { Module } from '@nestjs/common';
import { BanksController } from '@/banks/banks.controller';
import { BanksService } from '@/banks/banks.service';
import { BankPersistenceModule } from '@/banks/persistence/persistence.module';

/**
 * Banks module
 */
@Module({
  imports: [BankPersistenceModule],
  controllers: [BanksController],
  providers: [BanksService],
  exports: [BanksService],
})
export class BanksModule {}
