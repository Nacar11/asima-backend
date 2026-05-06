import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseUserRepository } from '@/users/persistence/base-user.repository';
import { UsersRepository } from '@/users/persistence/repositories/user.repository';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [
    {
      provide: BaseUserRepository,
      useClass: UsersRepository,
    },
  ],
  exports: [BaseUserRepository],
})
export class UserPersistenceModule {}
