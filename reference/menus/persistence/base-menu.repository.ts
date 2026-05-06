import { FindAllMenusDto } from '@/menus/dto/find-all-menus.dto';
import { DeepPartial } from '@/utils/types/deep-partial.type';
import { NullableType } from '@/utils/types/nullable.type';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { Menu } from '@/menus/domain/menu';

export abstract class BaseMenuRepository {
  abstract create(
    data: Omit<Menu, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Menu>;

  abstract findAllWithPagination({
    filterSearch,
    status,
    paginationOptions,
  }: {
    filterSearch: FindAllMenusDto['search'];
    status: FindAllMenusDto['status'] | 'all';
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<Menu>>;

  abstract findById(id: Menu['id']): Promise<NullableType<Menu>>;

  abstract findByIds(ids: Menu['id'][]): Promise<Menu[]>;

  abstract findAll(): Promise<Menu[]>;

  abstract update(
    id: Menu['id'],
    payload: DeepPartial<Menu>,
  ): Promise<Menu | null>;

  abstract remove(id: Menu['id']): Promise<void>;
}
