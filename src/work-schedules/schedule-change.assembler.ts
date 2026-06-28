import {
  ScheduleChangeImpact,
  ScheduleChangeResult,
} from '@/work-schedules/domain/schedule-change';
import {
  ScheduleChangeImpactResponseDto,
  ScheduleChangeResultResponseDto,
} from '@/work-schedules/dto/response/schedule-change-response.dto';
import { WorkScheduleAssembler } from '@/work-schedules/work-schedule.assembler';
import { toDto } from '@/utils/helpers/assemble';

/**
 * The wire seam for the schedule-change cascade. The `affected_*` lists are
 * structural copies (the `AffectedRequest` shape mirrors its DTO 1:1); the
 * nested `created_row` is mapped through `WorkScheduleAssembler` so the schedule
 * serializes via its own wire DTO. The e2e suite guards byte-for-byte parity.
 */
export class ScheduleChangeAssembler {
  static toImpactResponse(src: ScheduleChangeImpact): ScheduleChangeImpactResponseDto {
    return toDto(ScheduleChangeImpactResponseDto, src);
  }

  static toResultResponse(src: ScheduleChangeResult): ScheduleChangeResultResponseDto {
    return Object.assign(toDto(ScheduleChangeResultResponseDto, src), {
      created_row: src.created_row ? WorkScheduleAssembler.toResponse(src.created_row) : null,
    });
  }
}
