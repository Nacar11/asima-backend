import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BankAccountStatusEnum } from '@/bank-accounts/domain/bank-account';

/**
 * DTO for querying bank accounts
 */
export class QueryBankAccountDto {
  @ApiPropertyOptional({
    type: Number,
    example: 0,
    description: 'Number of records to skip',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 20,
    description: 'Number of records to take',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number;

  @ApiPropertyOptional({
    enum: ['ASC', 'DESC'],
    example: 'DESC',
    description: 'Sort direction',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortBy?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    enum: BankAccountStatusEnum,
    example: BankAccountStatusEnum.ACTIVE,
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(BankAccountStatusEnum)
  status?: BankAccountStatusEnum;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Filter by default status',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_default?: boolean;

  @ApiPropertyOptional({
    type: String,
    example: 'BPI',
    description: 'Search by bank name or account holder name',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
