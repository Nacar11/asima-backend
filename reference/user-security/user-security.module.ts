import { Module } from '@nestjs/common';
import { UserSecurityPersistenceModule } from './persistence/persistence.module';

@Module({
  imports: [UserSecurityPersistenceModule],
  exports: [UserSecurityPersistenceModule],
})
export class UserSecurityModule {}
