import { PartialType } from '@nestjs/swagger';
import { CreateSellerPortfolioDto } from './create-seller-portfolio.dto';

export class UpdateSellerPortfolioDto extends PartialType(
  CreateSellerPortfolioDto,
) {}
