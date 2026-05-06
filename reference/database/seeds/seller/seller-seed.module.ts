import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { SellerSeedService } from '@/database/seeds/seller/seller-seed.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { UserAddressEntity } from '@/user-addresses/persistence/entities/user-address.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SellerEntity, UserEntity, UserAddressEntity]),
  ],
  providers: [SellerSeedService],
  exports: [SellerSeedService],
})
export class SellerSeedModule {}
