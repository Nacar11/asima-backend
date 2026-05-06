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
 * DTO for creating admin vouchers with categories/products/services/service-categories scope and restrictions.
 */
export class CreateAdminVoucherDto extends CreateVoucherDto {
  @ApiPropertyOptional({
    enum: [
      VoucherScopeEnum.CATEGORIES,
      VoucherScopeEnum.PRODUCTS,
      VoucherScopeEnum.SERVICES,
      VoucherScopeEnum.SERVICE_CATEGORIES,
    ],
    example: VoucherScopeEnum.CATEGORIES,
  })
  @IsOptional()
  @IsIn([
    VoucherScopeEnum.CATEGORIES,
    VoucherScopeEnum.PRODUCTS,
    VoucherScopeEnum.SERVICES,
    VoucherScopeEnum.SERVICE_CATEGORIES,
  ])
  scope?:
    | VoucherScopeEnum.CATEGORIES
    | VoucherScopeEnum.PRODUCTS
    | VoucherScopeEnum.SERVICES
    | VoucherScopeEnum.SERVICE_CATEGORIES;
  @ApiPropertyOptional({
    type: [Number],
    description: 'Allowed when scope is categories',
    example: [10, 11],
  })
  @ValidateIf(
    (input: CreateAdminVoucherDto) =>
      input.scope === VoucherScopeEnum.CATEGORIES,
  )
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  category_ids?: number[];
  @ApiPropertyOptional({
    type: [Number],
    description: 'Required when scope is products',
    example: [1, 2],
  })
  @ValidateIf(
    (input: CreateAdminVoucherDto) => input.scope === VoucherScopeEnum.PRODUCTS,
  )
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  product_ids?: number[];
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
    description: 'Required when scope is services (unless service_id is set)',
    example: [1, 2],
  })
  @ValidateIf(
    (input: CreateAdminVoucherDto) =>
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
    (input: CreateAdminVoucherDto) =>
      input.scope === VoucherScopeEnum.SERVICE_CATEGORIES,
  )
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  service_category_ids?: number[];
}
