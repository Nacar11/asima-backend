import { LeaveAllocationRecord } from '@/leave-allocations/domain/leave-allocation';
import { LeaveAllocationResponseDto } from '@/leave-allocations/dto/response/leave-allocation-response.dto';
import { toDto, toDtoList } from '@/utils/helpers/assemble';

/**
 * The wire seam for leave allocations: the domain stays framework-free, and any
 * future domain↔wire divergence is expressed here. The structural-copy
 * mechanics live in `@/utils/helpers/assemble`.
 */
export class LeaveAllocationAssembler {
  static toResponse(src: LeaveAllocationRecord): LeaveAllocationResponseDto {
    return toDto(LeaveAllocationResponseDto, src);
  }

  static toResponseList(list: LeaveAllocationRecord[]): LeaveAllocationResponseDto[] {
    return toDtoList(LeaveAllocationResponseDto, list);
  }
}
