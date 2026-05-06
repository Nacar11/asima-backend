import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { FeaturedSectionEnum } from '@/products/products.enum';

/**
 * DTO for removing a product from a featured section (admin endpoint)
 */
export class RemoveFeaturedDto {
  @ApiProperty({
    enum: FeaturedSectionEnum,
    description: 'Section to remove the product from',
    example: FeaturedSectionEnum.FEATURED,
  })
  @IsNotEmpty()
  @IsEnum(FeaturedSectionEnum)
  section: FeaturedSectionEnum;
}
