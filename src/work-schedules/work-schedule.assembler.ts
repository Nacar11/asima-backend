import { WorkScheduleRecord } from '@/work-schedules/domain/work-schedule';
import { FindAllWorkSchedule } from '@/work-schedules/domain/find-all-work-schedule';
import { WorkScheduleResponseDto } from '@/work-schedules/dto/response/work-schedule-response.dto';
import { PaginatedResponse } from '@/utils/types/paginated-response.type';

/**
 * Maps the pure `WorkScheduleRecord` onto its HTTP response DTO. This is the
 * wire seam: the domain stays framework-free, and any future divergence between
 * the persisted shape and the wire shape is expressed here. Today the wire
 * mirrors the record 1:1 (snake_case end-to-end), so the mapping is a
 * structural copy. The e2e suite guards byte-for-byte parity.
 */
export class WorkScheduleAssembler {
  static toResponse(src: WorkScheduleRecord): WorkScheduleResponseDto {
    return Object.assign(new WorkScheduleResponseDto(), src);
  }

  static toPaginatedResponse(
    page: FindAllWorkSchedule,
  ): PaginatedResponse<WorkScheduleResponseDto> {
    return { ...page, data: page.data.map((item) => this.toResponse(item)) };
  }
}
