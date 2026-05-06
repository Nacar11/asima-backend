import { Module } from '@nestjs/common';
import { UserSearchHistoriesService } from '@/user-search-histories/user-search-histories.service';
import { UserSearchHistoriesController } from '@/user-search-histories/user-search-histories.controller';
import { UserSearchHistoriesPersistenceModule } from '@/user-search-histories/persistence/persistence.module';
import { RedisHelper } from '@/utils/helpers/redis.helper';

@Module({
  imports: [UserSearchHistoriesPersistenceModule],
  controllers: [UserSearchHistoriesController],
  providers: [UserSearchHistoriesService, RedisHelper],
  exports: [UserSearchHistoriesService],
})
export class UserSearchHistoriesModule {}
