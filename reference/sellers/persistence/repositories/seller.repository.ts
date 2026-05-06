import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseSellerRepository } from '@/sellers/persistence/base-seller.repository';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { SellerMapper } from '@/sellers/persistence/mappers/seller.mapper';
import { Seller } from '@/sellers/domain/seller';
import { FindAllSeller } from '@/sellers/domain/find-all-seller';
import { QuerySellerDto } from '@/sellers/dto/query-seller.dto';

/**
 * Concrete repository for seller persistence operations
 */
@Injectable()
export class SellerRepository extends BaseSellerRepository {
  constructor(
    @InjectRepository(SellerEntity)
    private readonly sellersrepository: Repository<SellerEntity>,
  ) {
    super();
  }

  async create(data: Seller): Promise<Seller> {
    const persistenceModel = SellerMapper.toPersistence(data);

    const newEntity = await this.sellersrepository.save(
      this.sellersrepository.create(persistenceModel),
    );
    const entityWithRelations = await this.sellersrepository.findOne({
      where: { id: newEntity.id },
      relations: ['created_by', 'updated_by', 'deleted_by'],
    });
    if (!entityWithRelations) {
      throw new Error('Failed to retrieve created seller');
    }
    return SellerMapper.toDomain(entityWithRelations);
  }

  async findAll(query: QuerySellerDto): Promise<FindAllSeller> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;
    const sortOrder = query.sortBy || 'DESC';

    // Map frontend field names to database column names
    const fieldMapping: Record<string, string> = {
      store_name: 'seller.store_name',
      store_description: 'seller.store_description',
      is_verified: 'seller.is_verified',
      sells_products: 'seller.sells_products',
      sells_services: 'seller.sells_services',
      created_at: 'seller.created_at',
      updated_at: 'seller.updated_at',
      status: 'seller.status',
      user_first_name: 'user.first_name', // Sort by user's first name
      user_last_name: 'user.last_name', // Sort by user's last name
    };

    // Determine sort field - default to created_at if not specified or invalid
    const sortField =
      query.sortField && fieldMapping[query.sortField]
        ? fieldMapping[query.sortField]
        : 'seller.created_at';

    const queryBuilder = this.sellersrepository.createQueryBuilder('seller');
    if (query.store_name) {
      queryBuilder.andWhere('seller.store_name ILIKE :store_name', {
        store_name: `%${query.store_name}%`,
      });
    }
    if (query.store_slug) {
      queryBuilder.andWhere('seller.slug = :store_slug', {
        store_slug: query.store_slug,
      });
    }
    if (query.is_verified !== undefined) {
      queryBuilder.andWhere('seller.is_verified = :is_verified', {
        is_verified: query.is_verified,
      });
    }
    if (query.is_active !== undefined) {
      queryBuilder.andWhere('seller.is_active = :is_active', {
        is_active: query.is_active,
      });
    }
    if (query.sells_products !== undefined) {
      queryBuilder.andWhere('seller.sells_products = :sells_products', {
        sells_products: query.sells_products,
      });
    }
    if (query.sells_services !== undefined) {
      queryBuilder.andWhere('seller.sells_services = :sells_services', {
        sells_services: query.sells_services,
      });
    }
    if (query.is_featured !== undefined) {
      queryBuilder.andWhere('seller.is_featured = :is_featured', {
        is_featured: query.is_featured,
      });
    }
    if (query.status !== undefined) {
      queryBuilder.andWhere('seller.status = :status', {
        status: query.status,
      });
    }
    if (query.edistrict_id !== undefined) {
      queryBuilder.andWhere('seller.edistrict_id = :edistrict_id', {
        edistrict_id: query.edistrict_id,
      });
    }
    if (query.exclude_seller_slug?.length) {
      queryBuilder.andWhere('seller.slug NOT IN (:...excludeSellerSlugs)', {
        excludeSellerSlugs: query.exclude_seller_slug.map((s) =>
          s.toLowerCase(),
        ),
      });
    }
    queryBuilder
      .leftJoinAndSelect('seller.user', 'user')
      .leftJoinAndSelect('seller.edistrict', 'edistrict')
      .leftJoinAndSelect('seller.created_by', 'created_by')
      .leftJoinAndSelect('seller.updated_by', 'updated_by')
      .leftJoinAndSelect('seller.deleted_by', 'deleted_by')
      .orderBy(sortField, sortOrder)
      .skip(skip)
      .take(take);
    const [entities, totalCount] = await queryBuilder.getManyAndCount();
    return {
      data: entities.map((entity) => SellerMapper.toDomain(entity)),
      totalCount,
      skip,
      take,
    };
  }

  async findById(id: number): Promise<Seller | null> {
    const entity = await this.sellersrepository.findOne({
      where: { id },
      relations: [
        'categories',
        'edistrict',
        'service_location_address',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });
    return entity ? SellerMapper.toDomain(entity) : null;
  }

  async findByStoreName(storeName: string): Promise<Seller | null> {
    const normalized = storeName.trim().toLowerCase();
    const entity = await this.sellersrepository
      .createQueryBuilder('seller')
      .leftJoinAndSelect('seller.user', 'user')
      .where('LOWER(seller.store_name) = :store_name', {
        store_name: normalized,
      })
      .getOne();
    return entity ? SellerMapper.toDomain(entity) : null;
  }

  async findByUserId(userId: number): Promise<Seller | null> {
    const entity = await this.sellersrepository.findOne({
      where: { user_id: userId },
      relations: [
        'user',
        'categories',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });
    return entity ? SellerMapper.toDomain(entity) : null;
  }

  async findBySlug(slug: string): Promise<Seller | null> {
    const entity = await this.sellersrepository.findOne({
      where: { slug },
      relations: ['categories', 'created_by', 'updated_by', 'deleted_by'],
    });
    return entity ? SellerMapper.toDomain(entity) : null;
  }

  async update(id: number, payload: Partial<Seller>): Promise<Seller> {
    const entity = await this.sellersrepository.findOne({
      where: { id },
      relations: ['created_by', 'updated_by', 'deleted_by'],
    });
    if (!entity) {
      throw new Error('Seller not found');
    }
    const updatedEntity = await this.sellersrepository.save(
      this.sellersrepository.create(
        SellerMapper.toPersistence({
          ...SellerMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );
    const entityWithRelations = await this.sellersrepository.findOne({
      where: { id: updatedEntity.id },
      relations: ['categories', 'created_by', 'updated_by', 'deleted_by'],
    });
    if (!entityWithRelations) {
      throw new Error('Failed to retrieve updated seller');
    }
    return SellerMapper.toDomain(entityWithRelations);
  }

  async findFeatured(): Promise<Seller[]> {
    const entities = await this.sellersrepository
      .createQueryBuilder('seller')
      .where('seller.is_featured = :is_featured', { is_featured: true })
      .andWhere('seller.is_active = :is_active', { is_active: true })
      .andWhere('seller.is_verified = :is_verified', { is_verified: true })
      .orderBy('seller.created_at', 'DESC')
      .getMany();
    return entities.map((entity) => SellerMapper.toDomain(entity));
  }

  async remove(id: number): Promise<void> {
    await this.sellersrepository.delete(id);
  }
}
