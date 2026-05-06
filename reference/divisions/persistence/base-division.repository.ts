import { NullableType } from '@/utils/types/nullable.type';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { Division } from '@/divisions/domain/division';
import { FindAllDivisionsDto } from '@/divisions/dto/find-all-divisions.dto';
import { User } from '@/users/domain/user';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';
import { DeepPartial, QueryRunner } from 'typeorm';

export abstract class BaseDivisionRepository {
  abstract create(
    data: Omit<Division, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Division>;

  abstract findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<Division>>;

  abstract findAllWithPagination({
    filterQuery,
    paginationOptions,
  }: {
    filterQuery?: FindAllDivisionsDto['search'];
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<Division>>;

  abstract findById(id: Division['id']): Promise<NullableType<Division>>;

  abstract findByIds(ids: Division['id'][]): Promise<Division[]>;

  abstract findByCode(
    division_code: Division['division_code'],
  ): Promise<NullableType<Division>>;

  abstract findAll(): Promise<
    Pick<Division, 'id' | 'division_code' | 'division_name'>[]
  >;

  abstract findDistinct(): Promise<Division[]>;

  abstract update(
    id: Division['id'],
    payload: Partial<Division>,
  ): Promise<Division>;

  abstract remove(id: Division['id'], causer: User): Promise<void>;

  abstract lookup(
    loadOptions: LookUpDto,
    exclude?: BulkExcludeDto,
  ): Promise<{
    data: { id: number; code: string; name: string }[];
    totalCount: number;
  }>;

  abstract bulkUpdate(
    ids: Division['id'][],
    payload: DeepPartial<Division>,
    queryRunner?: QueryRunner,
  ): Promise<void>;
}
