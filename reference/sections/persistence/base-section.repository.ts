import { NullableType } from '@/utils/types/nullable.type';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { Section } from '@/sections/domain/section';
import { FindAllSectionsDto } from '@/sections/dto/find-all-sections.dto';
import { User } from '@/users/domain/user';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';
import { DeepPartial, QueryRunner } from 'typeorm';

export abstract class BaseSectionRepository {
  abstract create(
    data: Omit<Section, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Section>;

  abstract findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<Section>>;

  abstract findAllWithPagination({
    filterQuery,
    paginationOptions,
  }: {
    filterQuery?: FindAllSectionsDto['search'];
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<Section>>;

  abstract findById(id: Section['id']): Promise<NullableType<Section>>;

  abstract findByIds(ids: Section['id'][]): Promise<Section[]>;

  abstract findByCode(
    section_code: Section['section_code'],
  ): Promise<NullableType<Section>>;

  abstract findAll(): Promise<
    Pick<Section, 'id' | 'section_code' | 'section_name'>[]
  >;

  abstract findDistinct(): Promise<Section[]>;

  abstract update(
    id: Section['id'],
    payload: Partial<Section>,
  ): Promise<Section>;

  abstract remove(id: Section['id'], causer: User): Promise<void>;

  abstract lookup(
    loadOptions: LookUpDto,
    exclude?: BulkExcludeDto,
  ): Promise<{
    data: { id: number; code: string; name: string }[];
    totalCount: number;
  }>;

  abstract bulkUpdate(
    ids: Section['id'][],
    payload: DeepPartial<Section>,
    queryRunner?: QueryRunner,
  ): Promise<void>;
}
