import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialAccountEntity } from './entities/social-account.entity';
import { SocialAccountRepository } from './repositories/social-account.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SocialAccountEntity])],
  providers: [SocialAccountRepository],
  exports: [SocialAccountRepository],
})
export class SocialAccountsPersistenceModule {}
