import { Module } from '@nestjs/common';
import { PasswordHistoryPersistenceModule } from './persistence/persistence.module';

@Module({
  imports: [PasswordHistoryPersistenceModule],
  exports: [PasswordHistoryPersistenceModule],
})
export class PasswordHistoryModule {}
