import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EkumpraProductSeedService } from './ekumpra-product-seed.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { MediaSharedModule } from '@/media/shared/media-shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, SellerEntity]),
    MediaSharedModule,
  ],
  providers: [EkumpraProductSeedService],
  exports: [EkumpraProductSeedService],
})
export class EkumpraProductSeedModule {}
