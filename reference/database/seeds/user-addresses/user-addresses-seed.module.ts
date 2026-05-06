import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAddressEntity } from '@/user-addresses/persistence/entities/user-address.entity';
import { UserAddressesSeedService } from '@/database/seeds/user-addresses/user-addresses-seed.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Seed module for user addresses
 */
@Module({
  imports: [TypeOrmModule.forFeature([UserAddressEntity, UserEntity])],
  providers: [UserAddressesSeedService],
  exports: [UserAddressesSeedService],
})
export class UserAddressesSeedModule {}
