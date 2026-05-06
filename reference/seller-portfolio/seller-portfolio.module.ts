import { Module } from '@nestjs/common';
import { SellerPortfolioService } from '@/seller-portfolio/seller-portfolio.service';
import { SellerPortfolioController } from '@/seller-portfolio/seller-portfolio.controller';
import { SellerPortfolioPersistenceModule } from '@/seller-portfolio/persistence/persistence.module';
import { SellersModule } from '@/sellers/sellers.module';

@Module({
  imports: [SellerPortfolioPersistenceModule, SellersModule],
  controllers: [SellerPortfolioController],
  providers: [SellerPortfolioService],
  exports: [SellerPortfolioService],
})
export class SellerPortfolioModule {}
