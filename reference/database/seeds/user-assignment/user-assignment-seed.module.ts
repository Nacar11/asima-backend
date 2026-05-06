import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAssignmentEntity } from '@/user-assignments/persistence/entities/user-assignment.entity';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { UserAssignmentSeedService } from './user-assignment-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserAssignmentEntity,
      UserGroupEntity,
      UserEntity,
    ]),
  ],
  providers: [UserAssignmentSeedService],
  exports: [UserAssignmentSeedService],
})
export class UserAssignmentSeedModule {}
