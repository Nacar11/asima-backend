import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerCertificationEntity } from '@/seller-certifications/persistence/entities/seller-certification.entity';
import { SellerCertificationRepository } from '@/seller-certifications/persistence/repositories/seller-certification.repository';
import { BaseSellerCertificationRepository } from '@/seller-certifications/persistence/base-seller-certification.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SellerCertificationEntity])],
  providers: [
    {
      provide: BaseSellerCertificationRepository,
      useClass: SellerCertificationRepository,
    },
  ],
  exports: [BaseSellerCertificationRepository],
})
export class SellerCertificationPersistenceModule {}
