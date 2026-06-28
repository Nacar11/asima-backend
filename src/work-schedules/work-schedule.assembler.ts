import { FindAllWorkSchedule } from '@/work-schedules/domain/find-all-work-schedule';
import { WorkScheduleRecord } from '@/work-schedules/domain/work-schedule';
import { WorkScheduleResponseDto } from '@/work-schedules/dto/response/work-schedule-response.dto';
import { toDto, toPaginatedDto } from '@/utils/helpers/assemble';
import { PaginatedResponse } from '@/utils/types/paginated-response.type';

/**
 * The wire seam for work schedules: the domain stays framework-free, and any
 * future domain↔wire divergence is expressed here. The structural-copy
 * mechanics live in `@/utils/helpers/assemble`.
 */
export class WorkScheduleAssembler {
  static toResponse(src: WorkScheduleRecord): WorkScheduleResponseDto {
    return toDto(WorkScheduleResponseDto, src);
  }

  static toPaginatedResponse(
    page: FindAllWorkSchedule,
  ): PaginatedResponse<WorkScheduleResponseDto> {
    return toPaginatedDto(WorkScheduleResponseDto, page);
  }
}
