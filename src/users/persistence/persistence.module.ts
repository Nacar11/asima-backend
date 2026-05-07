import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { UserRepository } from '@/users/persistence/repositories/user.repository';
import { BaseUserRepository } from '@/users/persistence/base-user.repository';
import { RolePersistenceModule } from '@/roles/persistence/persistence.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), RolePersistenceModule],
  providers: [UserRepository, { provide: BaseUserRepository, useClass: UserRepository }],
  exports: [BaseUserRepository, UserRepository, TypeOrmModule],
})
export class UserPersistenceModule {}
