import { Module } from '@nestjs/common';
import { MediaSharedModule } from '@/media/shared/media-shared.module';
import { MediaAdminsController } from '@/media/admins/media-admins.controller';
import { MediaAdminsService } from '@/media/admins/services/media-admins.service';
import { CategoryPersistenceModule } from '@/categories/persistence/persistence.module';

@Module({
  imports: [MediaSharedModule, CategoryPersistenceModule],
  controllers: [MediaAdminsController],
  providers: [MediaAdminsService],
})
export class MediaAdminsModule {}
