import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, QueryRunner, OrderByCondition } from 'typeorm';
import { CompanyEntity } from '@/companies/persistence/entities/company.entity';
import { NullableType } from '@/utils/types/nullable.type';
import { Company } from '@/companies/domain/company';
import { BaseCompanyRepository } from '@/companies/persistence/base-company.repository';
import { CompanyMapper } from '@/companies/persistence/mappers/company.mapper';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { MasterStatusEnum } from '@/utils/enums/status-enum';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { ISortFilter } from '@/devextreme/devextreme.interface';
import { createFieldFilters } from '@/devextreme/helpers/filter-condition.helper';
import { processMultiSortMapping } from '@/devextreme/helpers/sort.helper';
import { SqlStrategy } from '@/devextreme/strategies/sql.strategy';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class CompanyRepository implements BaseCompanyRepository {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
    private readonly clsService: ClsService,
  ) {}

  protected getRepository(
    queryRunner?: QueryRunner,
  ): Repository<CompanyEntity> {
    return queryRunner
      ? queryRunner.manager.getRepository(CompanyEntity)
      : this.companyRepository;
  }

  async create(data: Company): Promise<Company> {
    const persistenceModel = CompanyMapper.toPersistence(data);
    const newEntity = await this.companyRepository.save(
      this.companyRepository.create(persistenceModel),
    );
    return CompanyMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<Company>> {
    const [entities, totalResults] = await this.companyRepository.findAndCount({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });

    const data = entities.map((entity) => CompanyMapper.toDomain(entity));
    return { data, totalResults };
  }

  async findManyBy(loadOptions: GetQueryParams) {
    let { filter, sort: order } = loadOptions;

    const fieldMaps: ISortFilter[] = [
      {
        field: 'name',
        relatedFields: [
          'company.company_name',
          'company.short_name',
          'company.company_description',
        ],
      },
      {
        field: 'status',
        relatedFields: ['company.status'],
      },
    ];

    if (filter) {
      filter = await createFieldFilters(filter, fieldMaps);
    }

    if (order) {
      order = (processMultiSortMapping(
        order,
        fieldMaps,
      ) as GetQueryParams['sort']) ?? { 'company.id': 'ASC' };
    } else {
      order = { 'company.id': 'ASC' };
    }

    const { skip, take, where } = new SqlStrategy().get({
      ...loadOptions,
      filter,
    } as GetQueryParams);

    const query = this.companyRepository
      .createQueryBuilder('company')
      .where(where)
      .withDeleted()
      .orderBy(order as OrderByCondition)
      .skip(skip)
      .take(take);

    const [entities, totalCount] = await query.getManyAndCount();

    const data = entities.map((entity) => CompanyMapper.toDomain(entity));
    return { data, totalCount };
  }

  async findByName(company_name: string): Promise<Company | null> {
    const entity = await this.companyRepository.findOne({
      where: { company_name },
    });

    return entity ? CompanyMapper.toDomain(entity) : null;
  }

  async findByShortName(short_name: string): Promise<Company | null> {
    const entity = await this.companyRepository.findOne({
      where: { short_name },
    });

    return entity ? CompanyMapper.toDomain(entity) : null;
  }

  async findByTin(tin: string): Promise<Company | null> {
    const entity = await this.companyRepository.findOne({
      where: { tin },
    });

    return entity ? CompanyMapper.toDomain(entity) : null;
  }

  async bulkRemove(ids: Company['id'][]): Promise<void> {
    const causer = this.clsService.get('currentUser');

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new UnprocessableEntityException({
        status: 422,
        errors: { ids: 'Select 1 or more IDs to delete' },
      });
    }

    const invalidIds = ids.filter(
      (id) => typeof id !== 'number' || isNaN(id) || id <= 0,
    );
    if (invalidIds.length > 0) {
      throw new UnprocessableEntityException({
        status: 422,
        errors: { ids: 'All IDs must be valid positive numbers' },
      });
    }

    const existingCompanies = await this.companyRepository.find({
      where: {
        id: In(ids),
        status: MasterStatusEnum.ACTIVE,
      },
    });

    const existingIds = existingCompanies.map((company) => company.id);
    const nonExistentIds = ids.filter((id) => !existingIds.includes(id));

    if (nonExistentIds.length > 0) {
      throw new NotFoundException({
        status: 404,
        errors: {
          ids: `Companies with IDs ${nonExistentIds.join(', ')} do not exist or are already deleted`,
        },
      });
    }

    await this.companyRepository.update(
      { id: In(ids) },
      {
        status: MasterStatusEnum.CANCELLED,
        deleted_at: new Date(),
        deleted_by: causer,
      },
    );
  }

  async bulkHold(ids: Company['id'][]): Promise<void> {
    const causer = this.clsService.get('currentUser');

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new UnprocessableEntityException({
        status: 422,
        errors: { ids: 'Select 1 or more IDs to hold' },
      });
    }

    const invalidIds = ids.filter(
      (id) => typeof id !== 'number' || isNaN(id) || id <= 0,
    );
    if (invalidIds.length > 0) {
      throw new UnprocessableEntityException({
        status: 422,
        errors: { ids: 'All IDs must be valid positive numbers' },
      });
    }

    const existingCompanies = await this.companyRepository.find({
      where: {
        id: In(ids),
        status: MasterStatusEnum.ACTIVE,
      },
    });

    const existingIds = existingCompanies.map((company) => company.id);
    const nonExistentIds = ids.filter((id) => !existingIds.includes(id));

    if (nonExistentIds.length > 0) {
      throw new NotFoundException({
        status: 404,
        errors: {
          ids: `Companies with IDs ${nonExistentIds.join(', ')} do not exist or are not active`,
        },
      });
    }

    await this.companyRepository.update(
      { id: In(ids) },
      {
        status: MasterStatusEnum.HOLD,
        updated_at: new Date(),
        updated_by: causer,
      },
    );
  }

  async bulkRelease(ids: Company['id'][]): Promise<void> {
    const causer = this.clsService.get('currentUser');

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new UnprocessableEntityException({
        status: 422,
        errors: { ids: 'Select 1 or more IDs to release' },
      });
    }

    const invalidIds = ids.filter(
      (id) => typeof id !== 'number' || isNaN(id) || id <= 0,
    );
    if (invalidIds.length > 0) {
      throw new UnprocessableEntityException({
        status: 422,
        errors: { ids: 'All IDs must be valid positive numbers' },
      });
    }

    const existingCompanies = await this.companyRepository.find({
      where: {
        id: In(ids),
        status: MasterStatusEnum.HOLD,
      },
    });

    const existingIds = existingCompanies.map((company) => company.id);
    const nonExistentIds = ids.filter((id) => !existingIds.includes(id));

    if (nonExistentIds.length > 0) {
      throw new NotFoundException({
        status: 404,
        errors: {
          ids: `Companies with IDs ${nonExistentIds.join(', ')} do not exist or are not on hold`,
        },
      });
    }

    await this.companyRepository.update(
      { id: In(ids) },
      {
        status: MasterStatusEnum.ACTIVE,
        updated_at: new Date(),
        updated_by: causer,
      },
    );
  }

  async isMain(id: Company['id']): Promise<boolean> {
    const entity = await this.companyRepository.findOne({
      where: { id, is_main: true },
    });
    return !!entity;
  }

  async setAsMain(id: Company['id']): Promise<Company> {
    const causer = this.clsService.get('currentUser');

    const entity = await this.companyRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Company not found');
    }

    if (entity.is_main) {
      throw new UnprocessableEntityException({
        status: 422,
        errors: { id: 'Company is already set as main company' },
      });
    }

    return await this.companyRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const currentMainCompany = await transactionalEntityManager.findOne(
          CompanyEntity,
          { where: { is_main: true } },
        );

        if (currentMainCompany) {
          await transactionalEntityManager.update(
            CompanyEntity,
            { id: currentMainCompany.id },
            {
              is_main: false,
              updated_at: new Date(),
              updated_by: causer,
            },
          );
        }

        const updatedEntity = await transactionalEntityManager.save(
          CompanyEntity,
          {
            ...entity,
            is_main: true,
            updated_at: new Date(),
            updated_by: causer,
          },
        );

        return CompanyMapper.toDomain(updatedEntity);
      },
    );
  }

  async findById(id: Company['id']): Promise<NullableType<Company>> {
    const entity = await this.companyRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    return entity ? CompanyMapper.toDomain(entity) : null;
  }

  async findByIds(ids: Company['id'][]): Promise<Company[]> {
    const entities = await this.companyRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => CompanyMapper.toDomain(entity));
  }

  async findAll(): Promise<Company[]> {
    const companies = await this.companyRepository.find({
      where: [{ status: In([MasterStatusEnum.ACTIVE]) }],
    });

    return companies.map((entity) => CompanyMapper.toDomain(entity));
  }

  async update(
    id: Company['id'],
    payload: Partial<Company>,
    queryRunner?: QueryRunner,
  ): Promise<Company> {
    const entity = await this.companyRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException('Record not found');
    }

    const updatedEntity = await this.getRepository(queryRunner).save(
      this.companyRepository.create(
        CompanyMapper.toPersistence({
          ...CompanyMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return CompanyMapper.toDomain(updatedEntity);
  }

  async remove(id: Company['id']): Promise<void> {
    const entity = await this.companyRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException('Record not found');
    }

    await this.companyRepository.softRemove(entity);
  }
}
