import {
  ScheduleChangeImpact,
  ScheduleChangeResult,
} from '@/work-schedules/domain/schedule-change';
import {
  ScheduleChangeImpactResponseDto,
  ScheduleChangeResultResponseDto,
} from '@/work-schedules/dto/response/schedule-change-response.dto';
import { WorkScheduleAssembler } from '@/work-schedules/work-schedule.assembler';

/**
 * Maps the cascade's domain read-models onto their HTTP response DTOs. The
 * `affected_*` lists are structural copies (the `AffectedRequest` shape mirrors
 * its DTO 1:1); `created_row` is mapped through `WorkScheduleAssembler` so the
 * nested schedule serializes via its own wire DTO (I-2). The e2e suite guards
 * byte-for-byte parity.
 */
export class ScheduleChangeAssembler {
  static toImpactResponse(src: ScheduleChangeImpact): ScheduleChangeImpactResponseDto {
    return Object.assign(new ScheduleChangeImpactResponseDto(), src);
  }

  static toResultResponse(src: ScheduleChangeResult): ScheduleChangeResultResponseDto {
    return Object.assign(new ScheduleChangeResultResponseDto(), src, {
      created_row: src.created_row ? WorkScheduleAssembler.toResponse(src.created_row) : null,
    });
  }
}
