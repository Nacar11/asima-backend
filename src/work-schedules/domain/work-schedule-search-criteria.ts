import { DayOfWeek } from '@/work-schedules/work-schedules.constants';

export type WorkScheduleSearchCriteria = {
  employee_id?: number;
  day_of_week?: DayOfWeek;
  /** When true, return only rows where effective_to IS NULL. */
  activeOnly?: boolean;
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
};
