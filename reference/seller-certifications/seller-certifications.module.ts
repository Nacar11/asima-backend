import { Module } from '@nestjs/common';
import { SellerCertificationsService } from '@/seller-certifications/seller-certifications.service';
import { SellerCertificationsController } from '@/seller-certifications/seller-certifications.controller';
import { SellerCertificationPersistenceModule } from '@/seller-certifications/persistence/persistence.module';
import { SellersModule } from '@/sellers/sellers.module';

@Module({
  imports: [SellerCertificationPersistenceModule, SellersModule],
  controllers: [SellerCertificationsController],
  providers: [SellerCertificationsService],
  exports: [SellerCertificationsService],
})
export class SellerCertificationsModule {}
