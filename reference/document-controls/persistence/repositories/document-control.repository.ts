import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DeepPartial } from 'typeorm';
import { DocumentControlEntity } from '@/document-controls/persistence/entities/document-control.entity';
import { NullableType } from '@/utils/types/nullable.type';
import { DocumentControl } from '@/document-controls/domain/document-control';
import { BaseDocumentControlRepository } from '@/document-controls/persistence/base-document-control.repository';
import { DocumentControlMapper } from '@/document-controls/persistence/mappers/document-control.mapper';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { MasterStatusEnum } from '@/utils/enums/status-enum';
import {
  BaseGetDto,
  BaseGetDto as GetQueryParams,
} from '@/devextreme/dto/base-get.dto';
import { ISortFilter } from '@/devextreme/devextreme.interface';
import { createFieldFilters } from '@/devextreme/helpers/filter-condition.helper';
import { processMultiSortMapping } from '@/devextreme/helpers/sort.helper';
import { SqlStrategy } from '@/devextreme/strategies/sql.strategy';

@Injectable()
export class DocumentControlRepository
  implements BaseDocumentControlRepository
{
  constructor(
    @InjectRepository(DocumentControlEntity)
    private readonly documentControlRepository: Repository<DocumentControlEntity>,
  ) {}

  async create(data: DocumentControl): Promise<DocumentControl> {
    const persistenceModel = DocumentControlMapper.toPersistence(data);
    const newEntity = await this.documentControlRepository.save(
      this.documentControlRepository.create(persistenceModel),
    );
    return DocumentControlMapper.toDomain(newEntity);
  }

  async findManyBy(loadOptions: GetQueryParams) {
    let { filter, sort: order } = loadOptions;

    const fieldMaps: ISortFilter[] = [
      {
        field: 'id',
        relatedFields: ['dc.id'],
      },
      {
        field: 'status',
        relatedFields: ['CAST("dc"."status" AS TEXT)'],
      },
      {
        field: 'menu_code',
        relatedFields: ['menu.menu_code', 'menu.menu_code'],
      },
      {
        field: 'prefix_pattern',
        relatedFields: ['dc.prefix_pattern'],
      },
      {
        field: 'last_series',
        relatedFields: ['dc.last_series'],
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
      order = { 'menu.menu_code': 'ASC' };
    }

    const { skip, take, where } = new SqlStrategy().get({
      ...loadOptions,
      filter,
    } as BaseGetDto);

    const query = this.documentControlRepository
      .createQueryBuilder('dc')
      .leftJoin('dc.menu', 'menu')
      .select([
        'dc.id',
        'menu',
        'dc.status',
        'dc.prefix_pattern',
        'dc.last_series',
      ])
      .where(where)
      .withDeleted()
      .skip(skip)
      .take(take);
    const [entities, totalCount] = await query.getManyAndCount();

    const data = entities.map((entity) =>
      DocumentControlMapper.toDomain(entity),
    );
    return { data, totalCount };
  }

  async findByMenuCode(code: string): Promise<NullableType<DocumentControl>> {
    const entity = await this.documentControlRepository.findOne({
      where: { menu: { menu_code: code } },
      relations: ['menu'],
    });

    return entity ? DocumentControlMapper.toDomain(entity) : null;
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<DocumentControl>> {
    const [entities, totalResults] =
      await this.documentControlRepository.findAndCount({
        skip: (paginationOptions.page - 1) * paginationOptions.limit,
        take: paginationOptions.limit,
      });

    const data = entities.map((entity) =>
      DocumentControlMapper.toDomain(entity),
    );
    return { data, totalResults };
  }

  async findById(
    id: DocumentControl['id'],
  ): Promise<NullableType<DocumentControl>> {
    const entity = await this.documentControlRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    return entity ? DocumentControlMapper.toDomain(entity) : null;
  }

  async findByIds(ids: DocumentControl['id'][]): Promise<DocumentControl[]> {
    const entities = await this.documentControlRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => DocumentControlMapper.toDomain(entity));
  }

  async findByMenuId(menu: number): Promise<NullableType<DocumentControl>> {
    const entity = await this.documentControlRepository.findOne({
      where: { menu: { id: Number(menu) } },
    });
    return entity ? DocumentControlMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<DocumentControl[]> {
    const documentControls = await this.documentControlRepository.find({
      where: [{ status: In([MasterStatusEnum.ACTIVE]) }],
    });

    return documentControls.map((entity) =>
      DocumentControlMapper.toDomain(entity),
    );
  }

  async bulkUpdate(
    ids: DocumentControl['id'][],
    payload: DeepPartial<DocumentControl>,
  ): Promise<void> {
    const persistencePayload = DocumentControlMapper.toPersistence(
      payload as DocumentControl,
    );
    await this.documentControlRepository.update(ids, persistencePayload);
  }

  async update(
    id: DocumentControl['id'],
    payload: Partial<DocumentControl>,
  ): Promise<DocumentControl> {
    const entity = await this.documentControlRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException('Record not found');
    }

    const updatedEntity = await this.documentControlRepository.save(
      this.documentControlRepository.create(
        DocumentControlMapper.toPersistence({
          ...DocumentControlMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return DocumentControlMapper.toDomain(updatedEntity);
  }

  async remove(id: DocumentControl['id']): Promise<void> {
    const entity = await this.documentControlRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException('Record not found');
    }

    await this.documentControlRepository.softRemove(entity);
  }
}
