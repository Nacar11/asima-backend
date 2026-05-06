import { PartialType } from '@nestjs/swagger';
import { CreateMemberScheduleDto } from '@/member-schedules/dto/create-member-schedule.dto';

export class UpdateMemberScheduleDto extends PartialType(
  CreateMemberScheduleDto,
) {}
