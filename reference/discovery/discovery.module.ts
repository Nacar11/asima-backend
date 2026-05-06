import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscoveryController } from '@/discovery/discovery.controller';
import { DiscoveryService } from '@/discovery/discovery.service';
import { EdistrictService } from '@/discovery/edistrict.service';
import { AdminEdistrictController } from '@/discovery/controllers/admin-edistrict.controller';
import { EdistrictEntity } from '@/discovery/persistence/entities/edistrict.entity';
import { MembershipEntity } from '@/memberships/persistence/entities/membership.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EdistrictEntity, MembershipEntity, SellerEntity]),
  ],
  controllers: [DiscoveryController, AdminEdistrictController],
  providers: [DiscoveryService, EdistrictService],
  exports: [DiscoveryService, EdistrictService],
})
export class DiscoveryModule {}
