import { LeaveAllocationRecord } from '@/leave-allocations/domain/leave-allocation';
import { LeaveAllocationResponseDto } from '@/leave-allocations/dto/response/leave-allocation-response.dto';

/**
 * Maps the pure `LeaveAllocationRecord` onto its HTTP response DTO. The wire
 * seam: the domain stays framework-free, and any future divergence between the
 * persisted shape and the wire shape is expressed here. Today it is a faithful
 * structural copy (snake_case end-to-end), so the JSON is unchanged.
 */
export class LeaveAllocationAssembler {
  static toResponse(src: LeaveAllocationRecord): LeaveAllocationResponseDto {
    return Object.assign(new LeaveAllocationResponseDto(), src);
  }

  static toResponseList(list: LeaveAllocationRecord[]): LeaveAllocationResponseDto[] {
    return list.map((allocation) => this.toResponse(allocation));
  }
}
