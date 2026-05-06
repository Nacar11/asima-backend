import { PartialType } from '@nestjs/swagger';
import { CreateSellerScheduleDto } from '@/seller-schedules/dto/create-seller-schedule.dto';

export class UpdateSellerScheduleDto extends PartialType(
  CreateSellerScheduleDto,
) {}
