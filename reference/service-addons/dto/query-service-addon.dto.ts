import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { AddonStatusEnum } from '@/service-addons/enums/addon-status.enum';

export class QueryServiceAddonDto {
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  service_id?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: AddonStatusEnum })
  @IsOptional()
  @IsEnum(AddonStatusEnum)
  status?: AddonStatusEnum;

  @ApiPropertyOptional({ type: Number, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  skip?: number;

  @ApiPropertyOptional({ type: Number, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  take?: number;
}
