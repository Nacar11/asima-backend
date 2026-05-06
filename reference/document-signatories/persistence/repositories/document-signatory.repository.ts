import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, OrderByCondition, DeepPartial } from 'typeorm';
import { DocumentSignatoryEntity } from '@/document-signatories/persistence/entities/document-signatory.entity';
import { NullableType } from '@/utils/types/nullable.type';
import { DocumentSignatory } from '@/document-signatories/domain/document-signatory';
import { BaseDocumentSignatoryRepository } from '@/document-signatories/persistence/base-document-signatory.repository';
import { DocumentSignatoryMapper } from '@/document-signatories/persistence/mappers/document-signatory.mapper';
import { MasterStatusEnum } from '@/utils/enums/status-enum';
import { BaseGetDto } from '@/devextreme/dto/base-get.dto';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { ISortFilter } from '@/devextreme/devextreme.interface';
import { createFieldFilters } from '@/devextreme/helpers/filter-condition.helper';
import { processMultiSortMapping } from '@/devextreme/helpers/sort.helper';
import { SqlStrategy } from '@/devextreme/strategies/sql.strategy';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class DocumentSignatoryRepository
  implements BaseDocumentSignatoryRepository
{
  constructor(
    @InjectRepository(DocumentSignatoryEntity)
    private readonly documentSignatoryRepository: Repository<DocumentSignatoryEntity>,
    private readonly clsService: ClsService,
  ) {}

  async create(data: DocumentSignatory): Promise<DocumentSignatory> {
    const persistenceModel = DocumentSignatoryMapper.toPersistence(data);
    const newEntity = await this.documentSignatoryRepository.save(
      this.documentSignatoryRepository.create(persistenceModel),
    );
    return DocumentSignatoryMapper.toDomain(newEntity);
  }

  async findManyBy(loadOptions: GetQueryParams) {
    let { filter, sort: order } = loadOptions;

    const fieldMaps: ISortFilter[] = [
      {
        field: 'description',
        relatedFields: ['ds.description'],
      },
      {
        field: 'id',
        relatedFields: ['ds.id'],
      },
      {
        field: 'status',
        relatedFields: ['ds.status'],
      },
      {
        field: 'menu_code',
        relatedFields: ['menu.menu_code', 'menu.menu_name'],
      },
      {
        field: 'reviewed_by',
        relatedFields: [
          'reviewed_by.user_id',
          'reviewed_by.last_name',
          'reviewed_by.middle_name',
          'reviewed_by.first_name',
          'reviewed_by.email',
        ],
      },
      {
        field: 'approved_by',
        relatedFields: [
          'approved_by.user_id',
          'approved_by.last_name',
          'approved_by.middle_name',
          'approved_by.first_name',
          'approved_by.email',
        ],
      },
    ];

    if (filter) {
      filter = await createFieldFilters(filter, fieldMaps);
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

    const query = this.documentSignatoryRepository
      .createQueryBuilder('ds')
      .select(['ds.id', 'ds.description', 'ds.status', 'ds.deleted_at'])
      .leftJoinAndSelect('ds.menu', 'menu')
      .leftJoinAndSelect('ds.approved_by', 'approved_by')
      .leftJoinAndSelect('ds.reviewed_by', 'reviewed_by')
      .where(where)
      .withDeleted()
      .skip(skip)
      .take(take)
      .orderBy(order as OrderByCondition);
    const [entities, totalCount] = await query.getManyAndCount();

    const data = entities.map((entity) =>
      DocumentSignatoryMapper.toDomain(entity),
    );
    return { data, totalCount };
  }

  async findByMenuCode(code: string): Promise<NullableType<DocumentSignatory>> {
    const entity = await this.documentSignatoryRepository.findOne({
      where: { menu: { menu_code: code } },
      relations: ['menu'],
    });

    return entity ? DocumentSignatoryMapper.toDomain(entity) : null;
  }

  async findByMenuId(menu: number): Promise<NullableType<DocumentSignatory>> {
    const entity = await this.documentSignatoryRepository.findOne({
      where: { menu: { id: Number(menu) } },
      relations: ['menu'],
    });

    return entity ? DocumentSignatoryMapper.toDomain(entity) : null;
  }

  async findById(
    id: DocumentSignatory['id'],
  ): Promise<NullableType<DocumentSignatory>> {
    const entity = await this.documentSignatoryRepository.findOne({
      where: { id },
      relations: ['menu', 'approved_by', 'reviewed_by'],
      withDeleted: true,
    });

    return entity ? DocumentSignatoryMapper.toDomain(entity) : null;
  }

  async findByIds(
    ids: DocumentSignatory['id'][],
  ): Promise<DocumentSignatory[]> {
    const entities = await this.documentSignatoryRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => DocumentSignatoryMapper.toDomain(entity));
  }

  async findAll(): Promise<DocumentSignatory[]> {
    const documentSignatories = await this.documentSignatoryRepository.find({
      where: [{ status: In([MasterStatusEnum.ACTIVE]) }],
    });

    return documentSignatories.map((entity) =>
      DocumentSignatoryMapper.toDomain(entity),
    );
  }

  async bulkUpdate(
    ids: DocumentSignatory['id'][],
    payload: DeepPartial<DocumentSignatory>,
  ): Promise<void> {
    const persistencePayload = DocumentSignatoryMapper.toPersistence(
      payload as DocumentSignatory,
    );
    await this.documentSignatoryRepository.update(ids, persistencePayload);
  }

  async update(
    id: DocumentSignatory['id'],
    payload: Partial<DocumentSignatory>,
  ): Promise<DocumentSignatory> {
    const entity = await this.documentSignatoryRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException('Record not found');
    }

    const updatedEntity = await this.documentSignatoryRepository.save(
      this.documentSignatoryRepository.create(
        DocumentSignatoryMapper.toPersistence({
          ...DocumentSignatoryMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return DocumentSignatoryMapper.toDomain(updatedEntity);
  }

  async remove(id: DocumentSignatory['id']): Promise<void> {
    const causer = this.clsService.get('currentUser');
    const entity = await this.documentSignatoryRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException('Record not found');
    }

    await this.documentSignatoryRepository.update(id, {
      status: MasterStatusEnum.CANCELLED,
      deleted_at: new Date(),
      deleted_by: causer,
    });
  }
}
