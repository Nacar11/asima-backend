import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsInt, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ScheduleChangeDto } from '@/work-schedules/dto/admin/schedule-change.dto';

/** One request the preview reported would cancel — echoed back so apply can detect drift (S1). */
export class PreviewedCancelDto {
  @ApiProperty({ enum: ['leave', 'time_correction'] })
  @IsIn(['leave', 'time_correction'])
  kind!: 'leave' | 'time_correction';

  @ApiProperty({ example: 42 })
  @IsInt()
  id!: number;

  @ApiProperty({ example: 'approved' })
  @IsString()
  status!: string;
}

/**
 * Body for `POST /admin/work-schedules/changes` — the same intent as preview
 * plus the snapshot of what preview said would cancel. Apply recomputes the set
 * in-transaction and 409s if it no longer matches `previewed`.
 */
export class ApplyScheduleChangeDto extends ScheduleChangeDto {
  @ApiProperty({
    type: [PreviewedCancelDto],
    description: 'The (kind, id, status) of every request the preview listed for cancellation.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreviewedCancelDto)
  previewed!: PreviewedCancelDto[];
}
