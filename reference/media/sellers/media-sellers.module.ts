import { Module } from '@nestjs/common';
import { SellerPersistenceModule } from '@/sellers/persistence/persistence.module';
import { MediaSharedModule } from '@/media/shared/media-shared.module';
import { MediaSellersController } from '@/media/sellers/media-sellers.controller';
import { MediaSellersService } from '@/media/sellers/services/media-sellers.service';

@Module({
  imports: [MediaSharedModule, SellerPersistenceModule],
  controllers: [MediaSellersController],
  providers: [MediaSellersService],
  exports: [MediaSellersService],
})
export class MediaSellersModule {}
