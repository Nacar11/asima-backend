import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerMemberEntity } from '@/seller-members/persistence/entities/seller-member.entity';
import { BaseSellerMemberRepository } from '@/seller-members/persistence/base-seller-member.repository';
import { SellerMemberRepository } from '@/seller-members/persistence/repositories/seller-member.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SellerMemberEntity])],
  providers: [
    {
      provide: BaseSellerMemberRepository,
      useClass: SellerMemberRepository,
    },
  ],
  exports: [BaseSellerMemberRepository],
})
export class SellerMemberPersistenceModule {}
