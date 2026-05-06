import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  ValidateIf,
} from 'class-validator';
import { CreateVoucherDto } from '@/vouchers/dto/create-voucher.dto';
import { VoucherScopeEnum } from '@/vouchers/enums/voucher-scope.enum';

/**
 * DTO for creating seller vouchers with strict scope-based restriction payload.
 */
export class CreateSellerVoucherDto extends CreateVoucherDto {
  @ApiPropertyOptional({
    enum: [
      VoucherScopeEnum.PRODUCTS,
      VoucherScopeEnum.CATEGORIES,
      VoucherScopeEnum.SERVICES,
      VoucherScopeEnum.SERVICE_CATEGORIES,
    ],
    example: VoucherScopeEnum.PRODUCTS,
  })
  @IsIn([
    VoucherScopeEnum.PRODUCTS,
    VoucherScopeEnum.CATEGORIES,
    VoucherScopeEnum.SERVICES,
    VoucherScopeEnum.SERVICE_CATEGORIES,
  ])
  scope?:
    | VoucherScopeEnum.PRODUCTS
    | VoucherScopeEnum.CATEGORIES
    | VoucherScopeEnum.SERVICES
    | VoucherScopeEnum.SERVICE_CATEGORIES;
  @ApiPropertyOptional({
    type: [Number],
    description: 'Allowed when scope is products',
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  product_ids?: number[];
  @ApiPropertyOptional({
    type: [Number],
    description: 'Allowed when scope is categories',
    example: [10, 11],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  category_ids?: number[];
  @ApiPropertyOptional({
    type: Number,
    description:
      'Optional single service ID for per-service voucher (scope services)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  service_id?: number;
  @ApiPropertyOptional({
    type: [Number],
    description:
      'Required when scope is services (unless service_id is set). Must be services owned by the seller.',
    example: [1, 2],
  })
  @ValidateIf(
    (input: CreateSellerVoucherDto) =>
      input.scope === VoucherScopeEnum.SERVICES && input.service_id == null,
  )
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  service_ids?: number[];
  @ApiPropertyOptional({
    type: [Number],
    description: 'Required when scope is service-categories',
    example: [1, 2],
  })
  @ValidateIf(
    (input: CreateSellerVoucherDto) =>
      input.scope === VoucherScopeEnum.SERVICE_CATEGORIES,
  )
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  service_category_ids?: number[];
}
