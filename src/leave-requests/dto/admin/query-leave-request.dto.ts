import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsISO8601, IsOptional, Matches, Max, Min } from 'class-validator';
import {
  LEAVE_REQUEST_STATUSES,
  LEAVE_TYPES,
  LeaveRequestStatus,
  LeaveType,
} from '@/leave-requests/leave-requests.constants';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class QueryLeaveRequestDto {
  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === '' ? undefined : parseInt(value, 10)))
  @IsInt()
  employee_id?: number;

  @ApiPropertyOptional({
    isArray: true,
    enum: Object.values(LEAVE_REQUEST_STATUSES),
    description: 'Repeat the param or send a comma-separated list.',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === ''
      ? undefined
      : (Array.isArray(value) ? value : String(value).split(',')).map((s) => s.trim()),
  )
  @IsIn(Object.values(LEAVE_REQUEST_STATUSES), { each: true })
  status?: LeaveRequestStatus[];

  @ApiPropertyOptional({ enum: Object.values(LEAVE_TYPES) })
  @IsOptional()
  @IsIn(Object.values(LEAVE_TYPES))
  leave_type?: LeaveType;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(DATE_REGEX, { message: 'from must be YYYY-MM-DD' })
  from?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(DATE_REGEX, { message: 'to must be YYYY-MM-DD' })
  to?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === '' ? undefined : parseInt(value, 10)))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === '' ? undefined : parseInt(value, 10)))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
