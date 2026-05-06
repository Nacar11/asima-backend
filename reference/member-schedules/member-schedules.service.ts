import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BaseMemberScheduleRepository } from '@/member-schedules/persistence/base-member-schedule.repository';
import { CreateMemberScheduleDto } from '@/member-schedules/dto/create-member-schedule.dto';
import { UpdateMemberScheduleDto } from '@/member-schedules/dto/update-member-schedule.dto';
import { QueryMemberScheduleDto } from '@/member-schedules/dto/query-member-schedule.dto';
import { MemberSchedule } from '@/member-schedules/domain/member-schedule';
import { SellerMembersService } from '@/seller-members/seller-members.service';
import { User } from '@/users/domain/user';

@Injectable()
export class MemberSchedulesService {
  constructor(
    private readonly repository: BaseMemberScheduleRepository,
    private readonly sellerMembersService: SellerMembersService,
  ) {}

  private timeToMinutes(time: string): number {
    const [hours, minutes, seconds] = time.split(':').map((v) => Number(v));
    return hours * 60 + minutes + (seconds ? seconds / 60 : 0);
  }

  private ensureTimeWindow(
    start?: string | null,
    end?: string | null,
    label = 'schedule',
  ) {
    if ((start && !end) || (end && !start)) {
      throw new BadRequestException(
        `${label} start_time and end_time must both be provided together`,
      );
    }
    if (start && end && this.timeToMinutes(start) >= this.timeToMinutes(end)) {
      throw new BadRequestException(
        `${label} start_time must be before end_time`,
      );
    }
  }

  private ensureBreakWindow(
    breakStart?: string | null,
    breakEnd?: string | null,
  ) {
    if ((breakStart && !breakEnd) || (breakEnd && !breakStart)) {
      throw new BadRequestException(
        'break_start and break_end must both be provided together',
      );
    }
    if (
      breakStart &&
      breakEnd &&
      this.timeToMinutes(breakStart) >= this.timeToMinutes(breakEnd)
    ) {
      throw new BadRequestException(
        'break_start must be before break_end when provided',
      );
    }
  }

  async create(dto: CreateMemberScheduleDto, causer: User) {
    await this.sellerMembersService.findOne(dto.seller_member_id);
    this.ensureTimeWindow(dto.start_time, dto.end_time);
    this.ensureBreakWindow(dto.break_start, dto.break_end);

    const existing = await this.repository.findByMemberAndDay(
      dto.seller_member_id,
      dto.day_of_week,
    );
    if (existing) {
      throw new UnprocessableEntityException(
        'A schedule for this member and day already exists',
      );
    }

    const schedule = Object.assign(new MemberSchedule(), dto, {
      status: dto.status ?? 'Active',
      start_time: dto.start_time ?? null,
      end_time: dto.end_time ?? null,
      break_start: dto.break_start ?? null,
      break_end: dto.break_end ?? null,
      created_by: causer,
      updated_by: causer,
    });

    return this.repository.create(schedule);
  }

  async findAll(query: QueryMemberScheduleDto) {
    return this.repository.findAll(query);
  }

  async findById(id: number) {
    const schedule = await this.repository.findById(id);
    if (!schedule) throw new NotFoundException('Member schedule not found');
    return schedule;
  }

  async update(id: number, dto: UpdateMemberScheduleDto, causer: User) {
    const existing = await this.findById(id);
    const memberId = dto.seller_member_id ?? existing.seller_member_id;
    const dayOfWeek = dto.day_of_week ?? existing.day_of_week;

    await this.sellerMembersService.findOne(memberId);
    this.ensureTimeWindow(dto.start_time, dto.end_time);
    this.ensureBreakWindow(dto.break_start, dto.break_end);

    if (
      (dto.seller_member_id &&
        dto.seller_member_id !== existing.seller_member_id) ||
      (dto.day_of_week !== undefined &&
        dto.day_of_week !== existing.day_of_week)
    ) {
      const conflict = await this.repository.findByMemberAndDay(
        memberId,
        dayOfWeek,
      );
      if (conflict && conflict.id !== id) {
        throw new UnprocessableEntityException(
          'A schedule for this member and day already exists',
        );
      }
    }

    return this.repository.update(id, {
      ...dto,
      seller_member_id: memberId,
      day_of_week: dayOfWeek,
      updated_by: causer,
    });
  }

  async remove(id: number, causer: User) {
    await this.findById(id);
    await this.repository.remove(id, causer?.id);
  }
}
