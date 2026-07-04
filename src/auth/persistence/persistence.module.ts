import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokenEntity } from '@/auth/persistence/entities/refresh-token.entity';
import { RefreshTokenRepository } from '@/auth/persistence/repositories/refresh-token.repository';
import { BaseRefreshTokenRepository } from '@/auth/persistence/base-refresh-token.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RefreshTokenEntity])],
  providers: [
    RefreshTokenRepository,
    { provide: BaseRefreshTokenRepository, useClass: RefreshTokenRepository },
  ],
  exports: [BaseRefreshTokenRepository, TypeOrmModule],
})
export class RefreshTokenPersistenceModule {}
