import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseSellerMemberServiceRepository } from '@/seller-member-services/persistence/base-seller-member-service.repository';
import { CreateSellerMemberServiceDto } from '@/seller-member-services/dto/create-seller-member-service.dto';
import { UpdateSellerMemberServiceDto } from '@/seller-member-services/dto/update-seller-member-service.dto';
import { SellerMemberService } from '@/seller-member-services/domain/seller-member-service';
import { SellerMembersService } from '@/seller-members/seller-members.service';
import { User } from '@/users/domain/user';
import { ProficiencyLevelEnum } from '@/seller-member-services/enums/proficiency-level.enum';

@Injectable()
export class SellerMemberServicesService {
  constructor(
    private readonly repository: BaseSellerMemberServiceRepository,
    private readonly sellerMembersService: SellerMembersService,
  ) {}

  async create(
    dto: CreateSellerMemberServiceDto,
    causer: User,
  ): Promise<SellerMemberService> {
    await this.sellerMembersService.findOne(dto.seller_member_id);

    const payload = Object.assign(new SellerMemberService(), dto, {
      proficiency_level: dto.proficiency_level ?? ProficiencyLevelEnum.STANDARD,
      is_primary: dto.is_primary ?? false,
      status: dto.status ?? 'Active',
      created_by: causer,
      updated_by: causer,
    });
    return this.repository.create(payload);
  }

  async findAll(): Promise<SellerMemberService[]> {
    return this.repository.findAll();
  }

  async findOne(id: number): Promise<SellerMemberService> {
    const record = await this.repository.findById(id);
    if (!record) throw new NotFoundException('Seller member service not found');
    return record;
  }

  async update(
    id: number,
    dto: UpdateSellerMemberServiceDto,
    causer: User,
  ): Promise<SellerMemberService> {
    const existing = await this.findOne(id);
    if (
      dto.seller_member_id &&
      dto.seller_member_id !== existing.seller_member_id
    ) {
      await this.sellerMembersService.findOne(dto.seller_member_id);
    }
    return this.repository.update(id, { ...dto, updated_by: causer });
  }

  async remove(id: number, causer: User): Promise<void> {
    await this.findOne(id);
    await this.repository.update(id, { deleted_by: causer });
    await this.repository.remove(id);
  }
}
