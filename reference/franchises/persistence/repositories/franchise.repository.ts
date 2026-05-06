import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, OrderByCondition } from 'typeorm';
import { BaseFranchiseRepository } from '@/franchises/persistence/base-franchise.repository';
import { FranchiseEntity } from '@/franchises/persistence/entities/franchise.entity';
import { FranchiseMapper } from '@/franchises/persistence/mappers/franchise.mapper';
import { Franchise } from '@/franchises/domain/franchise';
import { FindAllFranchise } from '@/franchises/domain/find-all-franchise';
import { QueryFranchiseDto } from '@/franchises/dto/query-franchise.dto';
import { FRANCHISE_RELATIONS } from '@/franchises/franchises.constants';
import { createFieldFilters } from '@/devextreme/helpers/filter-condition.helper';
import { processMultiSortMapping } from '@/devextreme/helpers/sort.helper';
import { SqlStrategy } from '@/devextreme/strategies/sql.strategy';
import { IFieldFilter } from '@/devextreme/devextreme.interface';
import { BaseGetDto } from '@/devextreme/dto/base-get.dto';

/**
 * Concrete repository for franchise persistence operations
 */
@Injectable()
export class FranchiseRepository extends BaseFranchiseRepository {
  constructor(
    @InjectRepository(FranchiseEntity)
    private readonly franchisesRepository: Repository<FranchiseEntity>,
  ) {
    super();
  }

  async create(data: Franchise): Promise<Franchise> {
    const persistenceModel = FranchiseMapper.toPersistence(data);
    const newEntity = await this.franchisesRepository.save(
      this.franchisesRepository.create(persistenceModel),
    );
    const entityWithRelations = await this.franchisesRepository.findOne({
      where: { id: newEntity.id },
      relations: FRANCHISE_RELATIONS,
    });
    if (!entityWithRelations) {
      throw new Error('Failed to retrieve created franchise');
    }
    return FranchiseMapper.toDomain(entityWithRelations);
  }

  async findAll(query: QueryFranchiseDto): Promise<FindAllFranchise> {
    let { filter, sort: order } = query;

    // Define field mappings for DevExtreme filtering
    const fieldMaps: IFieldFilter[] = [
      {
        field: 'id',
        relatedFields: ['franchises.id::TEXT'],
      },
      {
        field: 'name',
        relatedFields: ['franchises.name', 'LOWER(franchises.name)'],
      },
      {
        field: 'owner_name',
        relatedFields: [
          'franchises.owner_name',
          'LOWER(franchises.owner_name)',
        ],
      },
      {
        field: 'email',
        relatedFields: ['franchises.email', 'LOWER(franchises.email)'],
      },
      {
        field: 'phone',
        relatedFields: ['franchises.phone'],
      },
      {
        field: 'city',
        relatedFields: ['franchises.city', 'LOWER(franchises.city)'],
      },
      {
        field: 'status',
        relatedFields: ['franchises.status'],
      },
      {
        field: 'onboarded_at',
        relatedFields: ['franchises.onboarded_at'],
      },
      {
        field: 'created_at',
        relatedFields: ['franchises.created_at'],
      },
      {
        field: 'updated_at',
        relatedFields: ['franchises.updated_at'],
      },
    ];

    // Process filters
    if (filter !== undefined) {
      let normalizedFilter: any = filter;
      if (typeof normalizedFilter === 'string') {
        try {
          normalizedFilter = JSON.parse(normalizedFilter);
        } catch {
          normalizedFilter = filter;
        }
      }

      if (Array.isArray(normalizedFilter)) {
        filter = await createFieldFilters(normalizedFilter, fieldMaps);
      } else {
        filter = normalizedFilter;
      }
    }

    // Process sorting
    if (order) {
      order = processMultiSortMapping(order, fieldMaps) as BaseGetDto['sort'];
    } else {
      order = { 'franchises.created_at': 'DESC' };
    }

    // Get skip, take, and where conditions using SqlStrategy
    const { skip, take, where } = new SqlStrategy().get({
      ...query,
      filter,
    } as BaseGetDto);

    // Build query
    const queryBuilder = this.franchisesRepository
      .createQueryBuilder('franchises')
      .where(where)
      .andWhere('franchises.deleted_at IS NULL');

    // Apply search filter (name + owner_name) - custom filter not in DevExtreme
    if (query.search) {
      queryBuilder.andWhere(
        '(franchises.name ILIKE :search OR franchises.owner_name ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    // Apply pagination, sorting, and relations
    queryBuilder
      .skip(skip)
      .take(take)
      .orderBy(order as OrderByCondition)
      .leftJoinAndSelect('franchises.created_by', 'created_by')
      .leftJoinAndSelect('franchises.updated_by', 'updated_by')
      .leftJoinAndSelect('franchises.deleted_by', 'deleted_by');

    const [entities, totalCount] = await queryBuilder.getManyAndCount();

    return {
      data: entities.map((entity) => FranchiseMapper.toDomain(entity)),
      totalCount,
      skip,
      take,
    };
  }

  async findById(id: number): Promise<Franchise | null> {
    const entity = await this.franchisesRepository.findOne({
      where: { id },
      relations: FRANCHISE_RELATIONS,
    });
    return entity ? FranchiseMapper.toDomain(entity) : null;
  }

  async update(id: number, payload: Partial<Franchise>): Promise<Franchise> {
    const entity = await this.franchisesRepository.findOne({
      where: { id },
      relations: FRANCHISE_RELATIONS,
    });
    if (!entity) {
      throw new Error('Franchise not found');
    }

    const updatedEntity = await this.franchisesRepository.save(
      this.franchisesRepository.create(
        FranchiseMapper.toPersistence({
          ...FranchiseMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    const entityWithRelations = await this.franchisesRepository.findOne({
      where: { id: updatedEntity.id },
      relations: FRANCHISE_RELATIONS,
    });
    if (!entityWithRelations) {
      throw new Error('Failed to retrieve updated franchise');
    }
    return FranchiseMapper.toDomain(entityWithRelations);
  }

  async remove(id: number): Promise<void> {
    await this.franchisesRepository.softDelete(id);
  }
}
