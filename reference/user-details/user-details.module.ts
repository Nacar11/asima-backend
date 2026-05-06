import { Module } from '@nestjs/common';
import { UserDetailsPersistenceModule } from './persistence/persistence.module';
import { UserDetailsService } from './user-details.service';
import { UserDetailsController } from './user-details.controller';
import { StorageModule } from '@/storage/storage.module';

@Module({
  imports: [UserDetailsPersistenceModule, StorageModule.register()],
  controllers: [UserDetailsController],
  providers: [UserDetailsService],
  exports: [UserDetailsService],
})
export class UserDetailsModule {}
