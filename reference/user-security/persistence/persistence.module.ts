import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSecurityRepository } from './repositories/user-security.repository';
import { UserSecurityEntity } from './entities/user-security.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserSecurityEntity])],
  providers: [UserSecurityRepository],
  exports: [UserSecurityRepository],
})
export class UserSecurityPersistenceModule {}
