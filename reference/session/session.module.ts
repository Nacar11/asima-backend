import { Module } from '@nestjs/common';
import { SessionPersistenceModule } from '@/session/persistence/persistence.module';
import { SessionService } from '@/session/session.service';

const persistenceModule = SessionPersistenceModule;

@Module({
  imports: [persistenceModule],
  providers: [SessionService],
  exports: [SessionService, persistenceModule],
})
export class SessionModule {}
