import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankEntity } from '@/banks/persistence/entities/bank.entity';
import { BankSeedService } from '@/database/seeds/bank/bank-seed.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Seed module for banks
 */
@Module({
  imports: [TypeOrmModule.forFeature([BankEntity, UserEntity])],
  providers: [BankSeedService],
  exports: [BankSeedService],
})
export class BankSeedModule {}
