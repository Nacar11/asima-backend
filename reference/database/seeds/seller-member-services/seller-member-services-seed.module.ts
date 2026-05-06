import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerMemberServiceEntity } from '@/seller-member-services/persistence/entities/seller-member-service.entity';
import { SellerMemberServicesSeedService } from '@/database/seeds/seller-member-services/seller-member-services-seed.service';
import { SellerMemberEntity } from '@/seller-members/persistence/entities/seller-member.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Seed module for seller member services
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SellerMemberServiceEntity,
      SellerMemberEntity,
      ServiceEntity,
      UserEntity,
    ]),
  ],
  providers: [SellerMemberServicesSeedService],
  exports: [SellerMemberServicesSeedService],
})
export class SellerMemberServicesSeedModule {}
