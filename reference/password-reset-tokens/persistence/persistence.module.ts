import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordResetTokenRepository } from './repositories/password-reset-token.repository';
import { PasswordResetTokenEntity } from './entities/password-reset-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PasswordResetTokenEntity])],
  providers: [PasswordResetTokenRepository],
  exports: [PasswordResetTokenRepository],
})
export class PasswordResetTokensPersistenceModule {}
