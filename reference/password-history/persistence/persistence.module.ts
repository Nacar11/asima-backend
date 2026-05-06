import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordHistoryRepository } from './repositories/password-history.repository';
import { PasswordHistoryEntity } from './entities/password-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PasswordHistoryEntity])],
  providers: [PasswordHistoryRepository],
  exports: [PasswordHistoryRepository],
})
export class PasswordHistoryPersistenceModule {}
