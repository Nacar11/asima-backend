import { LeaveRequestRecord } from '@/leave-requests/domain/leave-request';
import { LeaveRequestListItem } from '@/leave-requests/domain/leave-request-list-item';
import { LeaveBalance } from '@/leave-requests/domain/leave-balance';
import { FindAllLeaveRequest } from '@/leave-requests/domain/find-all-leave-request';
import { LeaveRequestResponseDto } from '@/leave-requests/dto/response/leave-request-response.dto';
import { LeaveRequestListItemResponseDto } from '@/leave-requests/dto/response/leave-request-list-item-response.dto';
import { LeaveBalanceResponseDto } from '@/leave-requests/dto/response/leave-balance-response.dto';
import { PaginatedResponse } from '@/utils/types/paginated-response.type';

/**
 * Maps pure domain records / read-models onto their HTTP response DTOs. This
 * is the wire seam: the domain stays framework-free, and any future
 * divergence between the persisted shape and the wire shape (computed fields,
 * omitted internals) is expressed here rather than leaking into the domain.
 *
 * Today the wire mirrors the domain 1:1 (snake_case end-to-end, no
 * translation layer — a project invariant), so the mapping is a structural
 * copy. The 135-test e2e suite guards byte-for-byte parity.
 */
export class LeaveRequestAssembler {
  static toResponse(src: LeaveRequestRecord): LeaveRequestResponseDto {
    return Object.assign(new LeaveRequestResponseDto(), src);
  }

  static toListItemResponse(src: LeaveRequestListItem): LeaveRequestListItemResponseDto {
    return Object.assign(new LeaveRequestListItemResponseDto(), src);
  }

  static toPaginatedResponse(
    page: FindAllLeaveRequest,
  ): PaginatedResponse<LeaveRequestListItemResponseDto> {
    return { ...page, data: page.data.map((item) => this.toListItemResponse(item)) };
  }

  static toBalanceResponse(src: LeaveBalance): LeaveBalanceResponseDto {
    return Object.assign(new LeaveBalanceResponseDto(), src);
  }

  static toBalanceResponseList(list: LeaveBalance[]): LeaveBalanceResponseDto[] {
    return list.map((balance) => this.toBalanceResponse(balance));
  }
}
