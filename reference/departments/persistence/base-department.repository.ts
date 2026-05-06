import { NullableType } from '@/utils/types/nullable.type';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { Department } from '@/departments/domain/department';
import { FindAllDepartmentsDto } from '@/departments/dto/find-all-departments.dto';
import { User } from '@/users/domain/user';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';
import { DeepPartial, QueryRunner } from 'typeorm';

export abstract class BaseDepartmentRepository {
  abstract create(
    data: Omit<Department, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Department>;

  abstract findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<Department>>;

  abstract findAllWithPagination({
    filterQuery,
    paginationOptions,
  }: {
    filterQuery?: FindAllDepartmentsDto['search'];
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<Department>>;

  abstract findById(id: Department['id']): Promise<NullableType<Department>>;

  abstract findByIds(ids: Department['id'][]): Promise<Department[]>;

  abstract findByCode(
    department_code: Department['department_code'],
  ): Promise<NullableType<Department>>;

  abstract findAll(): Promise<
    Pick<Department, 'id' | 'department_code' | 'department_name'>[]
  >;

  abstract findDistinct(): Promise<Department[]>;

  abstract update(
    id: Department['id'],
    payload: Partial<Department>,
  ): Promise<Department>;

  abstract remove(id: Department['id'], causer: User): Promise<void>;

  abstract lookup(
    loadOptions: LookUpDto,
    exclude?: BulkExcludeDto,
  ): Promise<{
    data: { id: number; code: string; name: string }[];
    totalCount: number;
  }>;

  abstract bulkUpdate(
    ids: Department['id'][],
    payload: DeepPartial<Department>,
    queryRunner?: QueryRunner,
  ): Promise<void>;
}
