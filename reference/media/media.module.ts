import { Module } from '@nestjs/common';
import { MediaSharedModule } from '@/media/shared/media-shared.module';
import { MediaSellersModule } from '@/media/sellers/media-sellers.module';
import { MediaAdminsModule } from '@/media/admins/media-admins.module';

@Module({
  imports: [MediaSharedModule, MediaSellersModule, MediaAdminsModule],
  exports: [MediaSharedModule, MediaSellersModule],
})
export class MediaModule {}
