import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseUserAssignmentRepository } from '@/user-assignments/persistence/base-user-assignment.repository';
import { UserAssignmentRepository } from '@/user-assignments/persistence/repositories/user-assignment.repository';
import { UserAssignmentEntity } from '@/user-assignments/persistence/entities/user-assignment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserAssignmentEntity])],
  providers: [
    {
      provide: BaseUserAssignmentRepository,
      useClass: UserAssignmentRepository,
    },
  ],
  exports: [BaseUserAssignmentRepository],
})
export class UserAssignmentPersistenceModule {}
