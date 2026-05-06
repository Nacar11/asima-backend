import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { DevExtremeGetDto } from '@/devextreme/dto/devextreme-get.dto';

export class QueryCarouselBannersAdminDto extends DevExtremeGetDto {
  @ApiPropertyOptional({
    type: String,
    example: 'Sale',
    description: 'Filter by headline',
  })
  @IsOptional()
  @IsString()
  headline?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Filter by media_id',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return parseInt(value, 10);
  })
  @IsInt()
  media_id?: number;
}
