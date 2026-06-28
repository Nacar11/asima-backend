import { FindAllCompensation } from '@/compensation/domain/find-all-compensation';
import { CompensationRecord } from '@/compensation/domain/compensation';
import { CompensationResponseDto } from '@/compensation/dto/response/compensation-response.dto';
import { toDto, toPaginatedDto } from '@/utils/helpers/assemble';
import { PaginatedResponse } from '@/utils/types/paginated-response.type';

/**
 * The wire seam for compensation: the domain stays framework-free, and any
 * future domain↔wire divergence is expressed here. The structural-copy
 * mechanics live in `@/utils/helpers/assemble`; the `currency` field rides the
 * record (mapper-filled), so the faithful copy carries it onto the DTO.
 */
export class CompensationAssembler {
  static toResponse(src: CompensationRecord): CompensationResponseDto {
    return toDto(CompensationResponseDto, src);
  }

  static toPaginatedResponse(
    page: FindAllCompensation,
  ): PaginatedResponse<CompensationResponseDto> {
    return toPaginatedDto(CompensationResponseDto, page);
  }
}
