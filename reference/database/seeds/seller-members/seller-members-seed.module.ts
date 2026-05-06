import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerMemberEntity } from '@/seller-members/persistence/entities/seller-member.entity';
import { SellerMembersSeedService } from '@/database/seeds/seller-members/seller-members-seed.service';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Seed module for seller members
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([SellerMemberEntity, SellerEntity, UserEntity]),
  ],
  providers: [SellerMembersSeedService],
  exports: [SellerMembersSeedService],
})
export class SellerMembersSeedModule {}
