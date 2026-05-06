import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { BookingApproversUserGroupSeedService } from './booking-approvers-user-group-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserGroupEntity, UserEntity, SellerEntity]),
  ],
  providers: [BookingApproversUserGroupSeedService],
  exports: [BookingApproversUserGroupSeedService],
})
export class BookingApproversUserGroupSeedModule {}
