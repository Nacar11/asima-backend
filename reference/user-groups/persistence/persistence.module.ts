import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseUserGroupRepository } from '@/user-groups/persistence/base-user-group.repository';
import { UserGroupRepository } from '@/user-groups/persistence/repositories/user-group.repository';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserGroupEntity])],
  providers: [
    {
      provide: BaseUserGroupRepository,
      useClass: UserGroupRepository,
    },
  ],
  exports: [BaseUserGroupRepository],
})
export class UserGroupPersistenceModule {}
