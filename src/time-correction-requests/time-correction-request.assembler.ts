import { TimeCorrectionRequestRecord } from '@/time-correction-requests/domain/time-correction-request';
import { TimeCorrectionRequestListItem } from '@/time-correction-requests/domain/time-correction-request-list-item';
import { FindAllTimeCorrectionRequest } from '@/time-correction-requests/domain/find-all-time-correction-request';
import { TimeCorrectionRequestResponseDto } from '@/time-correction-requests/dto/response/time-correction-request-response.dto';
import { TimeCorrectionRequestListItemResponseDto } from '@/time-correction-requests/dto/response/time-correction-request-list-item-response.dto';
import { PaginatedResponse } from '@/utils/types/paginated-response.type';

/**
 * Maps pure domain records / read-models onto their HTTP response DTOs. This is
 * the wire seam: the domain stays framework-free, and any future divergence
 * between the persisted shape and the wire shape (computed fields, omitted
 * internals) is expressed here rather than leaking into the domain.
 *
 * Today the wire mirrors the domain 1:1 (snake_case end-to-end, no translation
 * layer — a project invariant), so the mapping is a structural copy. The e2e
 * suite guards byte-for-byte parity.
 */
export class TimeCorrectionRequestAssembler {
  static toResponse(src: TimeCorrectionRequestRecord): TimeCorrectionRequestResponseDto {
    return Object.assign(new TimeCorrectionRequestResponseDto(), src);
  }

  static toListItemResponse(
    src: TimeCorrectionRequestListItem,
  ): TimeCorrectionRequestListItemResponseDto {
    return Object.assign(new TimeCorrectionRequestListItemResponseDto(), src);
  }

  static toPaginatedResponse(
    page: FindAllTimeCorrectionRequest,
  ): PaginatedResponse<TimeCorrectionRequestListItemResponseDto> {
    return { ...page, data: page.data.map((item) => this.toListItemResponse(item)) };
  }
}
