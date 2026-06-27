import { TimeCorrectionRequestRecord } from '@/time-correction-requests/domain/time-correction-request';

/**
 * List read-model: a time-correction request record plus the display names
 * resolved by a join at query time. Kept separate from the
 * `TimeCorrectionRequestRecord` (which stays a pure persisted record) — same
 * split as `LeaveRequestListItem`.
 *
 * Pure TS — no `@nestjs/*`. The Swagger shape for the extra `*_name` fields
 * lives on `dto/response/time-correction-request-list-item-response.dto.ts`.
 */
export class TimeCorrectionRequestListItem extends TimeCorrectionRequestRecord {
  employee_name!: string | null;

  l1_approver_name!: string | null;

  l2_approver_name!: string | null;
}
