import { Module } from '@nestjs/common';
import { BaseSessionRepository } from '@/session/persistence/base-session.repository';
import { SessionRepository } from '@/session/persistence/repositories/session.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionEntity } from '@/session/persistence/entities/session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SessionEntity])],
  providers: [
    {
      provide: BaseSessionRepository,
      useClass: SessionRepository,
    },
  ],
  exports: [BaseSessionRepository],
})
export class SessionPersistenceModule {}
