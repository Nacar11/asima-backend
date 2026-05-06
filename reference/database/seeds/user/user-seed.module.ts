import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '@/users/persistence/entities/user.entity';
import { UserSeedService } from '@/database/seeds/user/user-seed.service';
import { CostCenterEntity } from '@/cost-centers/persistence/entities/cost-center.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CostCenterEntity, UserEntity])],
  providers: [UserSeedService],
  exports: [UserSeedService],
})
export class UserSeedModule {}
