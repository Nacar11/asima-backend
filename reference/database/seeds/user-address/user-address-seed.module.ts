import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAddressSeedService } from './user-address-seed.service';
import { UserAddressEntity } from '@/user-addresses/persistence/entities/user-address.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserAddressEntity, UserEntity, SellerEntity]),
  ],
  providers: [UserAddressSeedService],
  exports: [UserAddressSeedService],
})
export class UserAddressSeedModule {}
