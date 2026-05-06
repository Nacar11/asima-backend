import { Module } from '@nestjs/common';
import { SellerMemberServicesService } from '@/seller-member-services/seller-member-services.service';
import { SellerMemberServicesController } from '@/seller-member-services/seller-member-services.controller';
import { SellerMemberServicePersistenceModule } from '@/seller-member-services/persistence/persistence.module';
import { SellerMembersModule } from '@/seller-members/seller-members.module';

@Module({
  imports: [SellerMemberServicePersistenceModule, SellerMembersModule],
  controllers: [SellerMemberServicesController],
  providers: [SellerMemberServicesService],
  exports: [SellerMemberServicesService, SellerMemberServicePersistenceModule],
})
export class SellerMemberServicesModule {}
