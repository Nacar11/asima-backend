import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerPortfolioEntity } from '@/seller-portfolio/persistence/entities/seller-portfolio.entity';
import { SellerPortfolioRepository } from '@/seller-portfolio/persistence/repositories/seller-portfolio.repository';
import { BaseSellerPortfolioRepository } from '@/seller-portfolio/persistence/base-seller-portfolio.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SellerPortfolioEntity])],
  providers: [
    {
      provide: BaseSellerPortfolioRepository,
      useClass: SellerPortfolioRepository,
    },
  ],
  exports: [BaseSellerPortfolioRepository],
})
export class SellerPortfolioPersistenceModule {}
