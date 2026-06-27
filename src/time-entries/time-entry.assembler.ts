import { TimeEntryRecord } from '@/time-entries/domain/time-entry';
import { FindAllTimeEntry } from '@/time-entries/domain/find-all-time-entry';
import { TimeEntryResponseDto } from '@/time-entries/dto/response/time-entry-response.dto';
import { PaginatedResponse } from '@/utils/types/paginated-response.type';

/**
 * Maps the pure `TimeEntryRecord` onto its HTTP response DTO. This is the wire
 * seam: the domain stays framework-free, and any future divergence between the
 * persisted shape and the wire shape is expressed here rather than leaking into
 * the domain.
 *
 * Today the wire mirrors the record 1:1 (snake_case end-to-end, no translation
 * layer), so the mapping is a structural copy. There is **no list-item** — the
 * module has no joined read-model, so the list returns the same DTO. The e2e
 * suite guards byte-for-byte parity.
 */
export class TimeEntryAssembler {
  static toResponse(src: TimeEntryRecord): TimeEntryResponseDto {
    return Object.assign(new TimeEntryResponseDto(), src);
  }

  static toPaginatedResponse(page: FindAllTimeEntry): PaginatedResponse<TimeEntryResponseDto> {
    return { ...page, data: page.data.map((item) => this.toResponse(item)) };
  }
}
