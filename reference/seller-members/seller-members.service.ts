import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseSellerMemberRepository } from '@/seller-members/persistence/base-seller-member.repository';
import { CreateSellerMemberDto } from '@/seller-members/dto/create-seller-member.dto';
import { UpdateSellerMemberDto } from '@/seller-members/dto/update-seller-member.dto';
import { FindAllSellerMembersDto } from '@/seller-members/dto/find-all-seller-members.dto';
import { SellerMember } from '@/seller-members/domain/seller-member';
import { UsersService } from '@/users/users.service';
import { SellersService } from '@/sellers/sellers.service';
import { User } from '@/users/domain/user';
import { SellerMemberStatusEnum } from '@/seller-members/enums/seller-member-status.enum';

@Injectable()
export class SellerMembersService {
  constructor(
    private readonly repository: BaseSellerMemberRepository,
    private readonly usersService: UsersService,
    private readonly sellersService: SellersService,
  ) {}

  async create(
    dto: CreateSellerMemberDto,
    causer: User,
  ): Promise<SellerMember> {
    await this.sellersService.findById(dto.seller_id);
    await this.usersService.findById(dto.user_id);

    const member = Object.assign(new SellerMember(), dto, {
      role: dto.role ?? 'member',
      is_service_provider: dto.is_service_provider ?? true,
      max_daily_bookings: dto.max_daily_bookings ?? 8,
      max_concurrent_bookings: dto.max_concurrent_bookings ?? 1,
      service_capacity_hours: dto.service_capacity_hours ?? 8,
      is_available_for_booking: dto.is_available_for_booking ?? true,
      status: dto.status ?? SellerMemberStatusEnum.ACTIVE,
      average_rating: 0,
      total_reviews: 0,
      total_completed_bookings: 0,
      created_by: causer,
      updated_by: causer,
    });

    return this.repository.create(member);
  }

  async findAll(query: FindAllSellerMembersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    return this.repository.findAll({ ...query, page, limit });
  }

  async findOne(id: number): Promise<SellerMember> {
    const member = await this.repository.findById(id);
    if (!member) throw new NotFoundException('Seller member not found');
    return member;
  }

  async update(
    id: number,
    dto: UpdateSellerMemberDto,
    causer: User,
  ): Promise<SellerMember> {
    await this.findOne(id);
    if (dto.seller_id) {
      await this.sellersService.findById(dto.seller_id);
    }
    if (dto.user_id) {
      await this.usersService.findById(dto.user_id);
    }
    return this.repository.update(id, {
      ...dto,
      updated_by: causer,
    });
  }

  async remove(id: number, causer: User): Promise<void> {
    await this.findOne(id);
    await this.repository.update(id, { deleted_by: causer });
    await this.repository.remove(id);
  }

  async bulkUpdateStatus(
    ids: number[],
    status: SellerMemberStatusEnum,
    causer: User,
  ): Promise<{ updated: number; failed: number; errors: string[] }> {
    if (!ids || ids.length === 0) {
      throw new NotFoundException('No seller member IDs provided');
    }

    const invalidIds = ids.filter((id) => !Number.isInteger(id) || id <= 0);
    if (invalidIds.length > 0) {
      throw new NotFoundException(
        `Invalid seller member IDs: ${invalidIds.join(', ')}`,
      );
    }

    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const id of ids) {
      try {
        await this.update(id, { status }, causer);
        updated++;
      } catch (error) {
        failed++;
        if (error instanceof NotFoundException) {
          errors.push(`Seller member ${id} not found`);
        } else {
          errors.push(`Failed to update seller member ${id}: ${error.message}`);
        }
      }
    }

    return {
      updated,
      failed,
      errors,
    };
  }
}
