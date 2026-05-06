import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  ArrayMinSize,
  ArrayMaxSize,
  IsInt,
  Min,
} from 'class-validator';
import { SellerMemberStatusEnum } from '@/seller-members/enums/seller-member-status.enum';

export class BulkUpdateStatusDto {
  @ApiProperty({
    type: [Number],
    description: 'Array of seller member IDs to update',
    example: [1, 2, 3],
    minItems: 1,
    maxItems: 100,
  })
  @IsArray({ message: 'ids must be an array' })
  @IsNotEmpty({ message: 'ids array cannot be empty' })
  @ArrayMinSize(1, {
    message: 'At least one seller member ID must be provided',
  })
  @ArrayMaxSize(100, {
    message: 'Cannot update more than 100 seller members at once',
  })
  @Type(() => Number)
  @IsInt({ each: true, message: 'Each ID must be a valid integer' })
  @Min(1, { each: true, message: 'Each ID must be a positive integer' })
  ids: number[];

  @ApiProperty({
    enum: SellerMemberStatusEnum,
    description: 'New status to apply to all selected seller members',
    example: SellerMemberStatusEnum.INACTIVE,
  })
  @IsEnum(SellerMemberStatusEnum, {
    message: 'status must be a valid seller member status',
  })
  status: SellerMemberStatusEnum;
}
