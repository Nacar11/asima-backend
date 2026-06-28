import { CompensationAuditRecord } from '@/compensation/domain/compensation-audit';
import { CompensationAuditResponseDto } from '@/compensation/dto/response/compensation-audit-response.dto';
import { toDto } from '@/utils/helpers/assemble';

/**
 * The wire seam for the compensation audit trail. The audit is an append-only
 * record (decision #6), so the assembler only maps a single row → DTO; the
 * trail endpoint returns a plain array mapped per-item.
 */
export class CompensationAuditAssembler {
  static toResponse(src: CompensationAuditRecord): CompensationAuditResponseDto {
    return toDto(CompensationAuditResponseDto, src);
  }
}
