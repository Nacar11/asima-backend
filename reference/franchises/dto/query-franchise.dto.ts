import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { DevExtremeGetDto } from '@/devextreme/dto/devextreme-get.dto';

export class QueryFranchiseDto extends DevExtremeGetDto {
  @ApiPropertyOptional({
    type: String,
    example: 'Manila Store',
    description: 'Search by franchise name or owner name',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
