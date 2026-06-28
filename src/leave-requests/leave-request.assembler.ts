import { LeaveRequestRecord } from '@/leave-requests/domain/leave-request';
import { LeaveRequestListItem } from '@/leave-requests/domain/leave-request-list-item';
import { LeaveBalance } from '@/leave-requests/domain/leave-balance';
import { FindAllLeaveRequest } from '@/leave-requests/domain/find-all-leave-request';
import { LeaveRequestResponseDto } from '@/leave-requests/dto/response/leave-request-response.dto';
import { LeaveRequestListItemResponseDto } from '@/leave-requests/dto/response/leave-request-list-item-response.dto';
import { LeaveBalanceResponseDto } from '@/leave-requests/dto/response/leave-balance-response.dto';
import { toDto, toPaginatedDto } from '@/utils/helpers/assemble';
import { PaginatedResponse } from '@/utils/types/paginated-response.type';

/**
 * The wire seam for leave requests: the domain stays framework-free, and any
 * future domain↔wire divergence (computed fields, omitted internals) is
 * expressed here rather than leaking into the domain. The structural-copy
 * mechanics live in `@/utils/helpers/assemble`; the paginated list returns the
 * joined **list-item** DTO (carries `*_name` fields), not the base response.
 */
export class LeaveRequestAssembler {
  static toResponse(src: LeaveRequestRecord): LeaveRequestResponseDto {
    return toDto(LeaveRequestResponseDto, src);
  }

  static toListItemResponse(src: LeaveRequestListItem): LeaveRequestListItemResponseDto {
    return toDto(LeaveRequestListItemResponseDto, src);
  }

  static toPaginatedResponse(
    page: FindAllLeaveRequest,
  ): PaginatedResponse<LeaveRequestListItemResponseDto> {
    return toPaginatedDto(LeaveRequestListItemResponseDto, page);
  }

  static toBalanceResponse(src: LeaveBalance): LeaveBalanceResponseDto {
    return toDto(LeaveBalanceResponseDto, src);
  }

  static toBalanceResponseList(list: LeaveBalance[]): LeaveBalanceResponseDto[] {
    return list.map((balance) => toDto(LeaveBalanceResponseDto, balance));
  }
}
