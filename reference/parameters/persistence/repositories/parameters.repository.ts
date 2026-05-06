import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, OrderByCondition } from 'typeorm';
import { ParameterEntity } from '@/parameters/persistence/entities/parameter.entity';
import { NullableType } from '@/utils/types/nullable.type';
import { Parameter } from '@/parameters/domain/parameter';
import { BaseParametersRepository } from '@/parameters/persistence/base-parameters.repository';
import { ParametersMapper } from '@/parameters/persistence/mappers/parameters.mapper';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { MasterStatusEnum } from '@/utils/enums/status-enum';
import { BaseGetDto } from '@/devextreme/dto/base-get.dto';
import { ISortFilter } from '@/devextreme/devextreme.interface';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { createFieldFilters } from '@/devextreme/helpers/filter-condition.helper';
import { processMultiSortMapping } from '@/devextreme/helpers/sort.helper';
import { SqlStrategy } from '@/devextreme/strategies/sql.strategy';
import { CompanyEntity } from '@/companies/persistence/entities/company.entity';

@Injectable()
export class ParameterRepository implements BaseParametersRepository {
  constructor(
    @InjectRepository(ParameterEntity)
    private readonly parameterRepository: Repository<ParameterEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
  ) {}

  async create(data: Parameter): Promise<Parameter> {
    const persistenceModel = ParametersMapper.toPersistence(data);
    const newEntity = await this.parameterRepository.save(
      this.parameterRepository.create(persistenceModel),
    );
    return ParametersMapper.toDomain(newEntity);
  }

  async findByCode(code: Parameter['code']): Promise<NullableType<Parameter>> {
    const entity = await this.parameterRepository.findOne({
      where: { code },
    });
    if (!entity) {
      return null;
    }
    return ParametersMapper.toDomain(entity);
  }

  async findByParamItem(
    param_items: Parameter['param_items'],
  ): Promise<NullableType<Parameter>> {
    const entity = await this.parameterRepository.findOne({
      where: { param_items },
    });

    if (!entity) {
      return null;
    }
    return ParametersMapper.toDomain(entity);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<Parameter>> {
    const [entities, totalResults] =
      await this.parameterRepository.findAndCount({
        skip: (paginationOptions.page - 1) * paginationOptions.limit,
        take: paginationOptions.limit,
      });

    const data = entities.map((entity) => ParametersMapper.toDomain(entity));
    return { data, totalResults };
  }

  async findById(id: Parameter['id']): Promise<NullableType<Parameter>> {
    const entity = await this.parameterRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException(`Parameter with ID ${id} does not exist!`);
    }

    return ParametersMapper.toDomain(entity);
  }

  async findByIds(ids: Parameter['id'][]): Promise<Parameter[]> {
    const entities = await this.parameterRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => ParametersMapper.toDomain(entity));
  }

  async findAll(): Promise<Parameter[]> {
    const parameters = await this.parameterRepository.find({
      where: [{ status: In([MasterStatusEnum.ACTIVE]) }],
    });

    return parameters.map((entity) => ParametersMapper.toDomain(entity));
  }

  async findManyBy(loadOptions: BaseGetDto) {
    let { filter, sort: order } = loadOptions;
    const fieldMaps: ISortFilter[] = [
      {
        field: 'id',
        relatedFields: [],
      },
      {
        field: 'code',
        relatedFields: [],
      },
      {
        field: 'name',
        relatedFields: [],
      },
    ];

    if (filter) {
      filter = (await createFieldFilters(
        filter,
        fieldMaps,
      )) as GetQueryParams['filter'];
    }

    if (order) {
      order = processMultiSortMapping(
        order,
        fieldMaps,
      ) as GetQueryParams['sort'];
    } else {
      order = { id: 'DESC' };
    }

    const { skip, take, where } = new SqlStrategy().get({
      ...loadOptions,
      filter,
    } as BaseGetDto);

    const query = this.parameterRepository
      .createQueryBuilder('parameter')
      .where(where)
      .skip(skip)
      .take(take)
      .orderBy(order as OrderByCondition);

    const [entities, totalCount] = await query.getManyAndCount();

    const data = entities.map((entity) => {
      return ParametersMapper.toDomain(entity);
    });

    return { data, totalCount };
  }

  async update(
    id: Parameter['id'],
    payload: Partial<Parameter>,
  ): Promise<Parameter> {
    const entity = await this.parameterRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException('Record not found');
    }

    const updatedEntity = await this.parameterRepository.save(
      this.parameterRepository.create(
        ParametersMapper.toPersistence({
          ...ParametersMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return ParametersMapper.toDomain(updatedEntity);
  }

  async remove(id: Parameter['id']): Promise<void> {
    const entity = await this.parameterRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException('Record not found');
    }

    await this.parameterRepository.softRemove(entity);
  }

  async checkFreeze(): Promise<void> {
    const fetchedParameters = await this.parameterRepository.findOne({
      select: ['id', 'boolean_value'],
      where: { code: 'ENABLE_INVENTORY_ENTRY_DURING_COUNT' },
    });

    const fetchedCompany = await this.companyRepository.findOne({
      select: ['id', 'inventory_opening'],
      where: { is_main: true },
    });

    if (!fetchedParameters || !fetchedCompany) {
      return;
    }

    if (
      fetchedParameters.boolean_value === false &&
      fetchedCompany.inventory_opening === true
    ) {
      {
        throw new ConflictException(
          'Inventory freeze active — saving transactions is not allowed while inventory counting is ongoing.',
        );
      }
    }
  }
}
