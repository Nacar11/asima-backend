import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { UserGroupSeedService } from './user-group-seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserGroupEntity, UserEntity])],
  providers: [UserGroupSeedService],
  exports: [UserGroupSeedService],
})
export class UserGroupSeedModule {}
