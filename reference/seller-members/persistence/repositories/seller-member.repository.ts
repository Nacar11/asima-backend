import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { BaseSellerMemberRepository } from '@/seller-members/persistence/base-seller-member.repository';
import { SellerMemberEntity } from '@/seller-members/persistence/entities/seller-member.entity';
import { SellerMemberMapper } from '@/seller-members/persistence/mappers/seller-member.mapper';
import { SellerMember } from '@/seller-members/domain/seller-member';
import { FindAllSellerMembersDto } from '@/seller-members/dto/find-all-seller-members.dto';

@Injectable()
export class SellerMemberRepository implements BaseSellerMemberRepository {
  constructor(
    @InjectRepository(SellerMemberEntity)
    private readonly repo: Repository<SellerMemberEntity>,
  ) {}

  async create(member: SellerMember): Promise<SellerMember> {
    const entity = await this.repo.save(
      this.repo.create(SellerMemberMapper.toPersistence(member)),
    );
    const withRelations = await this.repo.findOne({
      where: { id: entity.id },
      relations: ['seller', 'user', 'created_by', 'updated_by', 'deleted_by'],
    });
    return SellerMemberMapper.toDomain(withRelations ?? entity);
  }

  async findAll(
    params: FindAllSellerMembersDto,
  ): Promise<{ data: SellerMember[]; totalCount: number }> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 50, 50);
    const skip = (page - 1) * limit;

    // Valid sort fields whitelist
    const validSortFields = [
      'display_name',
      'role',
      'seller_id',
      'is_service_provider',
      'max_daily_bookings',
      'created_at',
      'updated_at',
      'status',
    ];

    // Validate and set sort field
    const sortField =
      params.sortField && validSortFields.includes(params.sortField)
        ? params.sortField
        : 'created_at';
    const sortBy = params.sortBy || 'DESC';

    // If search is needed, use QueryBuilder to handle relation-based search
    if (params.search) {
      const qb = this.repo
        .createQueryBuilder('sellerMember')
        .leftJoinAndSelect('sellerMember.seller', 'seller')
        .leftJoinAndSelect('sellerMember.user', 'user')
        .leftJoinAndSelect('sellerMember.created_by', 'created_by')
        .leftJoinAndSelect('sellerMember.updated_by', 'updated_by')
        .leftJoinAndSelect('sellerMember.deleted_by', 'deleted_by')
        .where(
          '(sellerMember.display_name ILIKE :search OR sellerMember.role ILIKE :search OR seller.store_name ILIKE :search)',
          { search: `%${params.search}%` },
        );

      // Apply other filters
      if (params.seller_id) {
        qb.andWhere('sellerMember.seller_id = :seller_id', {
          seller_id: params.seller_id,
        });
      }
      if (params.user_id) {
        qb.andWhere('sellerMember.user_id = :user_id', {
          user_id: params.user_id,
        });
      }
      if (params.status) {
        qb.andWhere('sellerMember.status = :status', { status: params.status });
      }

      // Build order clause - always prefix with sellerMember alias
      const orderField = `sellerMember.${sortField}`;
      qb.orderBy(orderField, sortBy as 'ASC' | 'DESC');

      // Add secondary sort for consistency
      if (sortField !== 'created_at') {
        qb.addOrderBy('sellerMember.created_at', 'DESC');
      }

      // Apply pagination
      qb.skip(skip).take(limit);

      const [entities, totalCount] = await qb.getManyAndCount();

      return {
        data: entities.map((e) => SellerMemberMapper.toDomain(e)),
        totalCount,
      };
    }

    // No search - use simpler FindOptionsWhere approach
    const where: FindOptionsWhere<SellerMemberEntity>[] = [];

    if (params.seller_id) {
      where.push({ seller_id: params.seller_id });
    }
    if (params.user_id) {
      where.push({ user_id: params.user_id });
    }
    if (params.status) {
      where.push({ status: params.status });
    }

    if (where.length === 0) {
      where.push({});
    }

    // Build order clause - use entity property names directly
    const order: Record<string, 'ASC' | 'DESC'> = {};

    // Primary sort field
    order[sortField] = sortBy;

    // Add secondary sort for consistency
    if (sortField !== 'created_at') {
      order['created_at'] = 'DESC';
    }

    const [entities, totalCount] = await this.repo.findAndCount({
      where,
      skip,
      take: limit,
      relations: ['seller', 'user', 'created_by', 'updated_by', 'deleted_by'],
      order,
    });

    return {
      data: entities.map((e) => SellerMemberMapper.toDomain(e)),
      totalCount,
    };
  }

  async findById(id: number): Promise<SellerMember | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['seller', 'user', 'created_by', 'updated_by', 'deleted_by'],
    });
    return entity ? SellerMemberMapper.toDomain(entity) : null;
  }

  async findByUserId(userId: number): Promise<SellerMember | null> {
    const entity = await this.repo.findOne({
      where: { user_id: userId },
      relations: ['seller', 'user'],
    });
    return entity ? SellerMemberMapper.toDomain(entity) : null;
  }

  async update(
    id: number,
    payload: Partial<SellerMember>,
  ): Promise<SellerMember> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new Error('Seller member not found');
    const updated = await this.repo.save(
      this.repo.create(
        SellerMemberMapper.toPersistence({
          ...SellerMemberMapper.toDomain(existing),
          ...payload,
        }),
      ),
    );
    const withRelations = await this.repo.findOne({
      where: { id: updated.id },
      relations: ['seller', 'user', 'created_by', 'updated_by', 'deleted_by'],
    });
    return SellerMemberMapper.toDomain(withRelations ?? updated);
  }

  async remove(id: number): Promise<void> {
    await this.repo.softDelete(id);
  }
}
