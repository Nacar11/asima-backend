import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ApprovePickleballMerchantApplicationDto {
  @ApiProperty({
    example: 3,
    description: 'Subscription plan to assign to the merchant owner account.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subscription_plan_id: number;

  @ApiPropertyOptional({ example: 'Ace Smash Liloan' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  location_name?: string;

  @ApiPropertyOptional({ example: 'ace-smash-liloan' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'location_key must be lowercase kebab-case',
  })
  location_key?: string;

  @ApiPropertyOptional({ example: 'Approved and ready for onboarding.' })
  @IsOptional()
  @IsString()
  review_notes?: string;
}
