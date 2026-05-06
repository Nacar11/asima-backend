import { MemberSchedule } from '@/member-schedules/domain/member-schedule';
import { QueryMemberScheduleDto } from '@/member-schedules/dto/query-member-schedule.dto';

export abstract class BaseMemberScheduleRepository {
  abstract create(
    data: Omit<MemberSchedule, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<MemberSchedule>;

  abstract findAll(
    query: QueryMemberScheduleDto,
  ): Promise<{ data: MemberSchedule[]; totalCount: number }>;

  abstract findById(id: number): Promise<MemberSchedule | null>;

  abstract findByMemberAndDay(
    seller_member_id: number,
    day_of_week: number,
  ): Promise<MemberSchedule | null>;

  abstract update(
    id: number,
    payload: Partial<MemberSchedule>,
  ): Promise<MemberSchedule>;

  abstract remove(id: number, causerId?: number): Promise<void>;
}
