import { FindAllMenusDto } from '@/menus/dto/find-all-menus.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMenuDto } from '@/menus/dto/create-menu.dto';
import { UpdateMenuDto } from '@/menus/dto/update-menu.dto';
import { BaseMenuRepository } from '@/menus/persistence/base-menu.repository';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { Menu } from '@/menus/domain/menu';
import { StatusEnum } from '@/menus/menus.enum';
import { User } from '@/users/domain/user';

@Injectable()
export class MenusService {
  constructor(
    // Dependencies here
    private readonly menuRepository: BaseMenuRepository,
  ) {}

  async create(createMenuDto: CreateMenuDto, causer: User) {
    // Do not remove comment below.
    // <creating-property />

    return this.menuRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      ...createMenuDto,
      status: StatusEnum.ACTIVE,
      created_by: causer,
      updated_by: causer,
    });
  }

  findAllWithPagination({
    filterSearch,
    status,
    paginationOptions,
  }: {
    filterSearch: FindAllMenusDto['search'];
    status: FindAllMenusDto['status'] | 'all';
    paginationOptions: IPaginationOptions;
  }) {
    return this.menuRepository.findAllWithPagination({
      filterSearch,
      status,
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: Menu['id']) {
    return this.menuRepository.findById(id);
  }

  findByIds(ids: Menu['id'][]) {
    return this.menuRepository.findByIds(ids);
  }

  findAll() {
    return this.menuRepository.findAll();
  }

  update(
    id: Menu['id'],

    updateMenuDto: UpdateMenuDto,
    causer: User,
  ) {
    // Do not remove comment below.
    // <updating-property />

    return this.menuRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      ...updateMenuDto,
      updated_by: causer,
    });
  }

  async remove(id: Menu['id'], causer: User) {
    const menu = await this.findById(id);

    if (!menu) throw new NotFoundException('Menu does not exist!');

    await this.menuRepository.update(id, {
      status: StatusEnum.CANCELLED,
      updated_by: causer,
      deleted_by: causer,
    });

    return this.menuRepository.remove(id);
  }
}
