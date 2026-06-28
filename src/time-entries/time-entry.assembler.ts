import { FindAllTimeEntry } from '@/time-entries/domain/find-all-time-entry';
import { TimeEntryRecord } from '@/time-entries/domain/time-entry';
import { TimeEntryResponseDto } from '@/time-entries/dto/response/time-entry-response.dto';
import { toDto, toPaginatedDto } from '@/utils/helpers/assemble';
import { PaginatedResponse } from '@/utils/types/paginated-response.type';

/**
 * The wire seam for time entries: the domain stays framework-free, and any
 * future domain↔wire divergence is expressed here. The structural-copy
 * mechanics live in `@/utils/helpers/assemble`. There is **no list-item** — the
 * module has no joined read-model, so the list returns the same DTO.
 */
export class TimeEntryAssembler {
  static toResponse(src: TimeEntryRecord): TimeEntryResponseDto {
    return toDto(TimeEntryResponseDto, src);
  }

  static toPaginatedResponse(page: FindAllTimeEntry): PaginatedResponse<TimeEntryResponseDto> {
    return toPaginatedDto(TimeEntryResponseDto, page);
  }
}
