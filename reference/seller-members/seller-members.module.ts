import { Module } from '@nestjs/common';
import { SellerMembersService } from '@/seller-members/seller-members.service';
import { SellerMembersController } from '@/seller-members/seller-members.controller';
import { SellerMemberPersistenceModule } from '@/seller-members/persistence/persistence.module';
import { UsersModule } from '@/users/users.module';
import { SellersModule } from '@/sellers/sellers.module';

@Module({
  imports: [SellerMemberPersistenceModule, UsersModule, SellersModule],
  controllers: [SellerMembersController],
  providers: [SellerMembersService],
  exports: [SellerMembersService, SellerMemberPersistenceModule],
})
export class SellerMembersModule {}
