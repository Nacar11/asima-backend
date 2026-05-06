import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserDetailRepository } from './repositories/user-detail.repository';
import { BaseUserDetailRepository } from './base-user-detail.repository';
import { UserDetailEntity } from './entities/user-detail.entity';
import { UserDetailMapper } from './mappers/user-detail.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([UserDetailEntity])],
  providers: [
    {
      provide: BaseUserDetailRepository,
      useClass: UserDetailRepository,
    },
    UserDetailMapper,
  ],
  exports: [BaseUserDetailRepository, UserDetailMapper],
})
export class UserDetailsPersistenceModule {}
