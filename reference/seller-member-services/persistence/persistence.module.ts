import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerMemberServiceEntity } from '@/seller-member-services/persistence/entities/seller-member-service.entity';
import { BaseSellerMemberServiceRepository } from '@/seller-member-services/persistence/base-seller-member-service.repository';
import { SellerMemberServiceRepository } from '@/seller-member-services/persistence/repositories/seller-member-service.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SellerMemberServiceEntity])],
  providers: [
    {
      provide: BaseSellerMemberServiceRepository,
      useClass: SellerMemberServiceRepository,
    },
  ],
  exports: [BaseSellerMemberServiceRepository],
})
export class SellerMemberServicePersistenceModule {}
