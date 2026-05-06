import { FindAllMenusDto } from '@/menus/dto/find-all-menus.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Brackets } from 'typeorm';
import { MenuEntity } from '@/menus/persistence/entities/menu.entity';
import { NullableType } from '@/utils/types/nullable.type';
import { Menu } from '@/menus/domain/menu';
import { BaseMenuRepository } from '@/menus/persistence/base-menu.repository';
import { MenuMapper } from '@/menus/persistence/mappers/menu.mapper';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { StatusEnum } from '@/menus/menus.enum';

@Injectable()
export class MenuRepository implements BaseMenuRepository {
  constructor(
    @InjectRepository(MenuEntity)
    private readonly menuRepository: Repository<MenuEntity>,
  ) {}

  async create(data: Menu): Promise<Menu> {
    const persistenceModel = MenuMapper.toPersistence(data);
    const newEntity = await this.menuRepository.save(
      this.menuRepository.create(persistenceModel),
    );
    return MenuMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    filterSearch,
    status,
    paginationOptions,
  }: {
    filterSearch: FindAllMenusDto['search'];
    status: FindAllMenusDto['status'] | 'all';
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<Menu>> {
    const queryBuilder = this.menuRepository.createQueryBuilder('menu');

    // Handle status filter
    if (status === 'all') {
      queryBuilder.andWhere('menu.status IN (:...statuses)', {
        statuses: [StatusEnum.ACTIVE, StatusEnum.CANCELLED],
      });
    } else {
      queryBuilder.andWhere('menu.status = :status', { status });
    }

    // Handle search filter
    if (filterSearch) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(menu.menu_code) LIKE :search').orWhere(
            'LOWER(menu.menu_name) LIKE :search',
          );
        }),
        { search: `%${filterSearch.toLowerCase()}%` },
      );
    }

    // Pagination: Ensure proper order
    queryBuilder
      .skip((paginationOptions.page - 1) * paginationOptions.limit) // OFFSET
      .take(paginationOptions.limit); // LIMIT

    // Execute query
    const [entities, totalResults] = await queryBuilder.getManyAndCount();

    const data = entities.map((entity) => MenuMapper.toDomain(entity));
    return { data, totalResults };
  }

  async findById(id: Menu['id']): Promise<NullableType<Menu>> {
    const entity = await this.menuRepository.findOne({
      where: { id },
    });

    return entity ? MenuMapper.toDomain(entity) : null;
  }

  async findByIds(ids: Menu['id'][]): Promise<Menu[]> {
    const entities = await this.menuRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => MenuMapper.toDomain(entity));
  }

  async findAll(): Promise<Menu[]> {
    const menus = await this.menuRepository.find({
      where: [{ status: In([StatusEnum.ACTIVE]) }],
    });

    return menus.map((entity) => MenuMapper.toDomain(entity));
  }

  async update(id: Menu['id'], payload: Partial<Menu>): Promise<Menu> {
    const entity = await this.menuRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException('Record not found');
    }

    const updatedEntity = await this.menuRepository.save(
      this.menuRepository.create(
        MenuMapper.toPersistence({
          ...MenuMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return MenuMapper.toDomain(updatedEntity);
  }

  async remove(id: Menu['id']): Promise<void> {
    const entity = await this.menuRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException('Record not found');
    }

    await this.menuRepository.softDelete({ id });
  }
}
