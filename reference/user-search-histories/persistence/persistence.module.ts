import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSearchHistoryEntity } from '@/user-search-histories/persistence/entities/user-search-history.entity';
import { UserSearchHistoryRepository } from '@/user-search-histories/persistence/repositories/user-search-history.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserSearchHistoryEntity])],
  providers: [UserSearchHistoryRepository],
  exports: [UserSearchHistoryRepository],
})
export class UserSearchHistoriesPersistenceModule {}
