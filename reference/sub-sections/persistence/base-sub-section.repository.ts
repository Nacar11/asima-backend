import { NullableType } from '@/utils/types/nullable.type';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { SubSection } from '@/sub-sections/domain/sub-section';
import { FindAllSubSectionsDto } from '@/sub-sections/dto/find-all-sub-sections.dto';
import { User } from '@/users/domain/user';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';
import { QueryRunner } from 'typeorm';
import { DeepPartial } from '@/utils/types/deep-partial.type';

export abstract class BaseSubSectionRepository {
  abstract create(
    data: Omit<SubSection, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<SubSection>;

  abstract findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<SubSection>>;

  abstract findAllWithPagination({
    filterQuery,
    paginationOptions,
  }: {
    filterQuery: FindAllSubSectionsDto['search'];
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<SubSection>>;

  abstract findById(id: SubSection['id']): Promise<NullableType<SubSection>>;

  abstract findByCode(
    sub_section_code: SubSection['sub_section_code'],
  ): Promise<NullableType<SubSection>>;

  abstract findByIds(ids: SubSection['id'][]): Promise<SubSection[]>;

  abstract findAll(): Promise<
    Pick<
      SubSection,
      'id' | 'sub_section_code' | 'sub_section_name' | 'sub_section_head'
    >[]
  >;

  abstract findDistinct(): Promise<SubSection[]>;

  abstract update(
    id: SubSection['id'],
    payload: Partial<SubSection>,
  ): Promise<SubSection>;

  abstract remove(id: SubSection['id'], causer: User): Promise<void>;

  abstract lookup(
    loadOptions: LookUpDto,
    exclude?: BulkExcludeDto,
  ): Promise<{
    data: { id: number; code: string; name: string }[];
    totalCount: number;
  }>;

  abstract bulkUpdate(
    ids: SubSection['id'][],
    payload: DeepPartial<SubSection>,
    queryRunner?: QueryRunner,
  ): Promise<void>;
}
