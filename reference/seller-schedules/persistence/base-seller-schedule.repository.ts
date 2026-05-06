import { SellerSchedule } from '@/seller-schedules/domain/seller-schedule';
import { QuerySellerScheduleDto } from '@/seller-schedules/dto/query-seller-schedule.dto';

export abstract class BaseSellerScheduleRepository {
  abstract create(
    data: Omit<SellerSchedule, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<SellerSchedule>;

  abstract findAll(
    query: QuerySellerScheduleDto,
  ): Promise<{ data: SellerSchedule[]; totalCount: number }>;

  abstract findById(id: number): Promise<SellerSchedule | null>;

  abstract findBySellerAndDay(
    seller_id: number,
    day_of_week: number,
  ): Promise<SellerSchedule | null>;

  abstract update(
    id: number,
    payload: Partial<SellerSchedule>,
  ): Promise<SellerSchedule>;

  abstract remove(id: number, causerId?: number): Promise<void>;
}
