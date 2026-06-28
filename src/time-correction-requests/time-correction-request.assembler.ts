import { TimeCorrectionRequestRecord } from '@/time-correction-requests/domain/time-correction-request';
import { TimeCorrectionRequestListItem } from '@/time-correction-requests/domain/time-correction-request-list-item';
import { FindAllTimeCorrectionRequest } from '@/time-correction-requests/domain/find-all-time-correction-request';
import { TimeCorrectionRequestResponseDto } from '@/time-correction-requests/dto/response/time-correction-request-response.dto';
import { TimeCorrectionRequestListItemResponseDto } from '@/time-correction-requests/dto/response/time-correction-request-list-item-response.dto';
import { toDto, toPaginatedDto } from '@/utils/helpers/assemble';
import { PaginatedResponse } from '@/utils/types/paginated-response.type';

/**
 * The wire seam for time-correction requests: the domain stays framework-free,
 * and any future domain↔wire divergence (computed fields, omitted internals) is
 * expressed here rather than leaking into the domain. The structural-copy
 * mechanics live in `@/utils/helpers/assemble`; the paginated list returns the
 * joined **list-item** DTO (carries `*_name` fields), not the base response.
 */
export class TimeCorrectionRequestAssembler {
  static toResponse(src: TimeCorrectionRequestRecord): TimeCorrectionRequestResponseDto {
    return toDto(TimeCorrectionRequestResponseDto, src);
  }

  static toListItemResponse(
    src: TimeCorrectionRequestListItem,
  ): TimeCorrectionRequestListItemResponseDto {
    return toDto(TimeCorrectionRequestListItemResponseDto, src);
  }

  static toPaginatedResponse(
    page: FindAllTimeCorrectionRequest,
  ): PaginatedResponse<TimeCorrectionRequestListItemResponseDto> {
    return toPaginatedDto(TimeCorrectionRequestListItemResponseDto, page);
  }
}
