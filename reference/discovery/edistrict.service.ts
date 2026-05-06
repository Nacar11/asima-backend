import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { EdistrictEntity } from '@/discovery/persistence/entities/edistrict.entity';
import { MembershipEntity } from '@/memberships/persistence/entities/membership.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { isMembershipAccessGranted } from '@/memberships/utils/membership-access.util';
import { EdistrictAdminListItemDto } from '@/discovery/dto/edistrict-admin-list-item.dto';
import { EdistrictResponseDto } from '@/discovery/dto/edistrict-response.dto';
import { DistrictMerchantResponseDto } from '@/discovery/dto/district-merchant-response.dto';
import { CreateEdistrictDto } from '@/discovery/dto/create-edistrict.dto';
import { UpdateEdistrictDto } from '@/discovery/dto/update-edistrict.dto';

@Injectable()
export class EdistrictService {
  constructor(
    @InjectRepository(EdistrictEntity)
    private readonly edistrictRepository: Repository<EdistrictEntity>,
    @InjectRepository(MembershipEntity)
    private readonly membershipRepository: Repository<MembershipEntity>,
    @InjectRepository(SellerEntity)
    private readonly sellerRepository: Repository<SellerEntity>,
  ) {}

  async findVisibleEdistricts(
    userId: number | null,
    skip = 0,
    take = 20,
  ): Promise<{
    data: EdistrictResponseDto[];
    totalCount: number;
    skip: number;
    take: number;
  }> {
    const [edistricts, totalCount] = await this.edistrictRepository.findAndCount({
      where: {
        status: In(['active', 'coming_soon', 'inactive']),
        deleted_at: IsNull(),
      },
      order: { display_order: 'ASC', id: 'ASC' },
      skip,
      take,
    });

    let userHasMembership = false;
    if (userId !== null) {
      const membershipEntity = await this.membershipRepository.findOne({
        where: { user_id: userId },
        order: { id: 'DESC' },
      });
      userHasMembership = isMembershipAccessGranted(membershipEntity, new Date());
    }

    return {
      data: edistricts.map((e) => ({
        id: e.id,
        key: e.key,
        name: e.name,
        subtitle: e.subtitle,
        store_name: e.store_name,
        seller_id: e.seller_id,
        image_url: e.image_url,
        background_image_url: e.background_image_url,
        status: e.status,
        display_order: e.display_order,
        is_members_only: e.is_members_only,
        is_locked:
          e.status === 'inactive' ||
          e.status === 'coming_soon' ||
          (e.is_members_only && !userHasMembership),
      })),
      totalCount,
      skip,
      take,
    };
  }

  async create(dto: CreateEdistrictDto): Promise<EdistrictAdminListItemDto> {
    const existing = await this.edistrictRepository.findOne({
      where: { key: dto.key, deleted_at: IsNull() },
    });
    if (existing) {
      throw new ConflictException(
        `An edistrict with key "${dto.key}" already exists`,
      );
    }

    const entity = this.edistrictRepository.create({
      key: dto.key,
      name: dto.name,
      subtitle: dto.subtitle ?? null,
      store_name: dto.store_name ?? null,
      seller_id: dto.seller_id ?? null,
      image_url: dto.image_url ?? null,
      background_image_url: dto.background_image_url ?? null,
      status: 'active',
      display_order: dto.display_order ?? 0,
      is_members_only: dto.is_members_only ?? false,
    });

    const saved = await this.edistrictRepository.save(entity);

    return this.toAdminDto(saved);
  }

  async update(
    id: number,
    dto: UpdateEdistrictDto,
  ): Promise<EdistrictAdminListItemDto> {
    const edistrict = await this.edistrictRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });
    if (!edistrict) throw new NotFoundException(`Edistrict #${id} not found`);

    if (dto.key && dto.key !== edistrict.key) {
      const existing = await this.edistrictRepository.findOne({
        where: { key: dto.key, deleted_at: IsNull() },
      });
      if (existing) {
        throw new ConflictException(
          `An edistrict with key "${dto.key}" already exists`,
        );
      }
    }

    await this.edistrictRepository.update(id, {
      ...(dto.key !== undefined && { key: dto.key }),
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
      ...(dto.store_name !== undefined && { store_name: dto.store_name }),
      ...(dto.seller_id !== undefined && { seller_id: dto.seller_id }),
      ...(dto.image_url !== undefined && { image_url: dto.image_url }),
      ...(dto.background_image_url !== undefined && {
        background_image_url: dto.background_image_url,
      }),
      ...(dto.display_order !== undefined && {
        display_order: dto.display_order,
      }),
      ...(dto.is_members_only !== undefined && {
        is_members_only: dto.is_members_only,
      }),
    });

    const updated = await this.edistrictRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });

    return this.toAdminDto(updated!);
  }

  async findAllForAdmin(): Promise<EdistrictAdminListItemDto[]> {
    const edistricts = await this.edistrictRepository.find({
      where: { deleted_at: IsNull() },
      order: { display_order: 'ASC', id: 'ASC' },
    });

    return edistricts.map((e) => this.toAdminDto(e));
  }

  async delete(id: number): Promise<void> {
    const edistrict = await this.edistrictRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });
    if (!edistrict) throw new NotFoundException(`Edistrict #${id} not found`);
    await this.edistrictRepository.softRemove(edistrict);
  }

  async updateStatus(
    id: number,
    status: 'active' | 'inactive' | 'coming_soon',
  ): Promise<void> {
    const edistrict = await this.edistrictRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });
    if (!edistrict) throw new NotFoundException(`Edistrict #${id} not found`);
    await this.edistrictRepository.update(id, { status });
  }

  async findMerchantsByEdistrictId(
    id: number,
    skip = 0,
    take = 20,
  ): Promise<{
    data: DistrictMerchantResponseDto[];
    totalCount: number;
    skip: number;
    take: number;
  }> {
    const edistrict = await this.edistrictRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });
    if (!edistrict) throw new NotFoundException(`Edistrict #${id} not found`);

    const [sellers, totalCount] = await this.sellerRepository.findAndCount({
      where: {
        edistrict_id: id,
        is_active: true,
        deleted_at: IsNull(),
      },
      select: {
        id: true,
        store_name: true,
        slug: true,
        store_logo_url: true,
        is_verified: true,
        average_rating: true,
        total_reviews: true,
      },
      skip,
      take,
    });

    return {
      data: sellers.map((s) => ({
        id: s.id,
        store_name: s.store_name,
        slug: s.slug,
        store_logo_url: s.store_logo_url,
        is_verified: s.is_verified,
        average_rating: Number(s.average_rating),
        total_reviews: s.total_reviews,
      })),
      totalCount,
      skip,
      take,
    };
  }

  private toAdminDto(e: EdistrictEntity): EdistrictAdminListItemDto {
    return {
      id: e.id,
      key: e.key,
      name: e.name,
      subtitle: e.subtitle,
      store_name: e.store_name,
      image_url: e.image_url,
      background_image_url: e.background_image_url,
      status: e.status,
      display_order: e.display_order,
      is_members_only: e.is_members_only,
    };
  }
}
