import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  MaxLength,
  IsArray,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Stock Business Logic Validator
 * New model: stock_quantity = stock for sale (becomes available_quantity)
 *            stock_on_hand = private stock (not for sale)
 *            Total inventory = stock_on_hand + stock_quantity
 */
@ValidatorConstraint({ name: 'stockBusinessLogic', async: false })
export class StockBusinessLogicValidator
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments) {
    const dto = args.object as CreateProductVariantDto;

    const reservedQuantity = dto.reserved_quantity ?? 0;
    const availableQuantity = dto.available_quantity;

    if (reservedQuantity < 0) {
      return false;
    }

    if (availableQuantity !== undefined && availableQuantity < 0) {
      return false;
    }

    if (availableQuantity !== undefined) {
      const expectedStockQuantity = reservedQuantity + availableQuantity;
      if (dto.stock_quantity !== expectedStockQuantity) {
        return false;
      }
    }

    // Validate min_stock_level <= stock_quantity (sellable stock)
    if (dto.min_stock_level !== undefined) {
      if (dto.min_stock_level > dto.stock_quantity) {
        return false;
      }
    }

    // stock_on_hand is independent of stock_quantity in new model
    // stock_on_hand = private stock, stock_quantity = sellable stock
    // No constraint between them

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const dto = args.object as CreateProductVariantDto;

    const reservedQuantity = dto.reserved_quantity ?? 0;
    const availableQuantity = dto.available_quantity;

    if (reservedQuantity < 0) {
      return 'Reserved quantity must not be less than 0';
    }

    if (availableQuantity !== undefined && availableQuantity < 0) {
      return 'Available quantity must not be less than 0';
    }

    if (availableQuantity !== undefined) {
      const expectedStockQuantity = reservedQuantity + availableQuantity;
      if (dto.stock_quantity !== expectedStockQuantity) {
        return `Stock quantity (${dto.stock_quantity}) must equal reserved_quantity (${reservedQuantity}) + available_quantity (${availableQuantity})`;
      }
    }

    if (dto.min_stock_level !== undefined) {
      if (dto.min_stock_level > dto.stock_quantity) {
        return `Minimum stock level (${dto.min_stock_level}) cannot be greater than stock quantity (${dto.stock_quantity})`;
      }
    }

    return 'Invalid stock business logic';
  }
}

export class CreateProductVariantDto {
  @ApiPropertyOptional({
    description:
      'Product ID (optional for sync, will be set from URL parameter)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  product_id?: number;

  @ApiProperty({ description: 'Stock Keeping Unit' })
  @IsString()
  @MaxLength(50)
  sku: string;

  @ApiProperty({ description: 'Variant name' })
  @IsString()
  @MaxLength(255)
  variant_name: string;

  @ApiPropertyOptional({
    description: 'Variant description',
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: 'Selling price' })
  @Type(() => Number)
  @IsNumber()
  selling_price: number;

  @ApiProperty({ description: 'Cost price', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cost_price?: number;

  @ApiProperty({ description: 'Minimum order quantity', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minimum_order?: number;

  @ApiPropertyOptional({
    description: 'Display order for stable ordering within a product',
    required: false,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  display_order?: number;

  @ApiProperty({
    description: 'Variant status',
    enum: ['Active', 'Inactive'],
    default: 'Active',
  })
  @IsOptional()
  @IsEnum(['Active', 'Inactive'])
  status?: 'Active' | 'Inactive';

  @ApiPropertyOptional({ description: 'Product media ID', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  media_id?: number;

  @ApiProperty({
    description: 'Array of attribute value IDs that define this variant',
    type: [Number],
  })
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  attribute_value_ids: number[];

  @ApiProperty({
    description:
      'Stock quantity available for sale (becomes available_quantity)',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Validate(StockBusinessLogicValidator)
  stock_quantity: number;

  @ApiPropertyOptional({
    description: 'Reserved quantity (optional, defaults to 0)',
    required: false,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  reserved_quantity?: number;

  @ApiPropertyOptional({
    description:
      'Available quantity (optional). If provided, must satisfy stock_quantity = reserved_quantity + available_quantity',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  available_quantity?: number;

  @ApiProperty({
    description:
      'Private stock held by seller, not for public sale (optional, defaults to 0)',
    required: false,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock_on_hand?: number;

  @ApiProperty({
    description:
      'Minimum stock level (required, must be >= 0 and <= stock_quantity)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_stock_level?: number;
}
