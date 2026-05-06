import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  ValidateIf,
} from 'class-validator';
import { InspectionResultEnum } from '../domain/inspection-result.enum';
import { FailedInspectionActionEnum } from '../domain/failed-inspection-action.enum';

export class InspectReturnDto {
  @ApiProperty({
    description: 'Inspection result',
    enum: InspectionResultEnum,
    example: InspectionResultEnum.PASSED,
  })
  @IsNotEmpty()
  @IsEnum(InspectionResultEnum)
  result: InspectionResultEnum;

  @ApiPropertyOptional({
    description: 'Inspection reason (required if inspection failed)',
    example: 'Item is not in original condition',
    maxLength: 500,
  })
  @ValidateIf((o) => o.result === InspectionResultEnum.FAILED)
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({
    description: 'Action for failed inspection (required if inspection failed)',
    enum: FailedInspectionActionEnum,
    example: FailedInspectionActionEnum.KEEP_ITEM,
  })
  @ValidateIf((o) => o.result === InspectionResultEnum.FAILED)
  @IsNotEmpty()
  @IsEnum(FailedInspectionActionEnum)
  failed_action?: FailedInspectionActionEnum;

  @ApiPropertyOptional({
    description: 'Partial refund amount (optional for failed inspections)',
    example: 25.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  partial_refund_amount?: number;
}
