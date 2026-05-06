import { UsersService } from '@/users/users.service';
import { User } from '@/users/domain/user';
import {
  NotFoundException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { CreateDivisionDto } from '@/divisions/dto/create-division.dto';
import { UpdateDivisionDto } from '@/divisions/dto/update-division.dto';
import { BaseDivisionRepository } from '@/divisions/persistence/base-division.repository';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { Division } from '@/divisions/domain/division';
import { FindAllDivisionsDto } from '@/divisions/dto/find-all-divisions.dto';
import { MasterStatusEnum, StatusEnum } from '@/utils/enums/status-enum';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class DivisionsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly divisionRepository: BaseDivisionRepository,
    private readonly clsService: ClsService,
  ) {}

  /**
   * Creates a new division and saves it to the database.
   *
   * This method first checks for two conditions:
   * 1. If a division with the provided `division_code` already exists.
   * 2. If the user designated as the `division_head` exists.
   *
   * If the code is already in use, it throws an `UnprocessableEntityException`. If the division head is not found,
   * it throws a `NotFoundException`. Otherwise, it creates and returns the new division.
   * The 'causer' is recorded as both the creator and the last updater.
   *
   * @async
   * @param {CreateDivisionDto} createDivisionDto - The data transfer object containing the details for the new division (code, name, head).
   * @param {User} causer - The user performing the creation action.
   * @returns {Promise<Division>} A promise that resolves to the newly created division entity.
   * @throws {UnprocessableEntityException} If the division code already exists in the database.
   * @throws {NotFoundException} If the specified division head user does not exist.
   */
  async create(createDivisionDto: CreateDivisionDto, causer: User) {
    // check if code already exist
    const division = await this.divisionRepository.findByCode(
      createDivisionDto.division_code,
    );

    if (division)
      throw new UnprocessableEntityException('Division code already exist!');

    const division_head = await this.usersService.findById(
      createDivisionDto.division_head,
    );

    if (!division_head)
      throw new NotFoundException('Division head does not exist!');

    return this.divisionRepository.create({
      division_head,
      division_code: createDivisionDto.division_code,
      division_name: createDivisionDto.division_name,
      status: createDivisionDto.status ?? StatusEnum.ACTIVE,
      created_by: causer,
      updated_by: causer,
    });
  }

  findByMany(queryParams: GetQueryParams) {
    const queryParamsParsed = {
      ...queryParams,
      filter: queryParams?.filter,
    };
    return this.divisionRepository.findByMany(queryParamsParsed);
  }

  findAllWithPagination({
    filterQuery,
    paginationOptions,
  }: {
    filterQuery: FindAllDivisionsDto['search'];
    paginationOptions: IPaginationOptions;
  }) {
    return this.divisionRepository.findAllWithPagination({
      filterQuery,
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  async findById(id: Division['id']) {
    const division = await this.divisionRepository.findById(id);

    if (!division) throw new NotFoundException('Division does not exist!');

    return division;
  }

  findByIds(ids: Division['id'][]) {
    return this.divisionRepository.findByIds(ids);
  }

  findByCode(code: Division['division_code']) {
    const division = this.divisionRepository.findByCode(code);

    if (!division) throw new NotFoundException('Division does not exist!');

    return division;
  }

  findAll() {
    return this.divisionRepository.findAll();
  }

  async findDistinct() {
    const divisions = await this.divisionRepository.findDistinct();
    return divisions.map((division) => division.division_name);
  }

  async update(
    id: Division['id'],
    updateDivisionDto: UpdateDivisionDto,
    causer: User,
  ): Promise<Division> {
    const division = await this.findById(id);
    const partialDivision: Partial<Division> = new Division();

    if (!division) throw new NotFoundException('Division does not exist!');

    Object.assign(partialDivision, updateDivisionDto);

    // check if code already exist
    if (
      updateDivisionDto.division_code &&
      updateDivisionDto.division_code != division.division_code
    ) {
      const divisionCode = await this.divisionRepository.findByCode(
        updateDivisionDto.division_code,
      );

      if (divisionCode)
        throw new UnprocessableEntityException('Division code already exist!');
    }

    if (updateDivisionDto.division_head) {
      const divisionHead = await this.usersService.findById(
        updateDivisionDto.division_head,
      );

      if (!divisionHead)
        throw new NotFoundException('Division head does not exist!');

      partialDivision.division_head = divisionHead;
    }

    partialDivision.updated_by = causer;

    return this.divisionRepository.update(id, partialDivision);
  }

  async remove(id: Division['id'], causer: User) {
    const division = await this.findById(id);

    if (!division) throw new NotFoundException('Division does not exist!');

    await this.divisionRepository.remove(id, causer);
  }

  async lookup(queryParams: LookUpDto, exclude?: BulkExcludeDto) {
    const queryParamsParsed = {
      ...queryParams,
      searchExpr: (queryParams.searchExpr || '').replace(/"/g, ''),
      searchOperation: (queryParams.searchOperation || '').replace(/"/g, ''),
      searchValue: (queryParams.searchValue || '').replace(/"/g, ''),
    };

    if (queryParamsParsed.searchExpr) {
      queryParamsParsed.filter = [
        queryParamsParsed.searchExpr,
        queryParamsParsed.searchOperation,
        queryParamsParsed.searchValue,
      ];
    }
    return await this.divisionRepository.lookup(queryParamsParsed, exclude);
  }

  async lookupById(id: number) {
    const result = await this.findById(id);
    return {
      id: result?.id,
      code: result?.division_code,
      name: result?.division_name,
    };
  }

  async bulkHold(ids: Division['id'][]) {
    const causer = this.clsService.get('currentUser');
    const sections = await this.divisionRepository.findByIds(ids);
    if (sections.length === 0) {
      throw new NotFoundException('No sections found for the provided IDs.');
    }

    const alreadyHold = sections.filter(
      (c) => c.status === MasterStatusEnum.HOLD,
    );

    if (alreadyHold.length > 0) {
      const controlNos = alreadyHold.map((c) => c.division_code).join(', ');
      throw new BadRequestException(
        `The following Divisions are already on HOLD: ${controlNos}`,
      );
    }

    const nonActive = sections.filter(
      (c) => c.status !== MasterStatusEnum.ACTIVE,
    );

    if (nonActive.length > 0) {
      const controlNos = nonActive.map((c) => c.division_code).join(', ');
      throw new BadRequestException(
        `The following Divisions are not in ACTIVE status and cannot be HOLD: ${controlNos}`,
      );
    }

    await this.divisionRepository.bulkUpdate(ids, {
      status: MasterStatusEnum.HOLD,
      updated_by: causer,
    });
  }

  async bulkRelease(ids: Division['id'][]) {
    const causer = this.clsService.get('currentUser');
    const sections = await this.divisionRepository.findByIds(ids);

    if (sections.length === 0) {
      throw new NotFoundException('No sections found for the provided IDs.');
    }

    const alreadyReleased = sections.filter(
      (c) => c.status === MasterStatusEnum.ACTIVE,
    );

    if (alreadyReleased.length > 0) {
      const controlNos = alreadyReleased.map((c) => c.division_code).join(', ');
      throw new BadRequestException(
        `The following Divisions are already RELEASED: ${controlNos}`,
      );
    }

    const nonActive = sections.filter(
      (c) => c.status !== MasterStatusEnum.HOLD,
    );

    if (nonActive.length > 0) {
      const controlNos = nonActive.map((c) => c.division_code).join(', ');
      throw new BadRequestException(
        `The following Divisions are not in HOLD status and cannot be RELEASED: ${controlNos}`,
      );
    }

    await this.divisionRepository.bulkUpdate(ids, {
      status: MasterStatusEnum.ACTIVE,
      updated_by: causer,
    });
  }

  async bulkDelete(ids: Division['id'][]) {
    const sections = await this.divisionRepository.findByIds(ids);
    const causer = this.clsService.get('currentUser');

    if (sections.length === 0) {
      throw new NotFoundException('No sections found for the provided IDs.');
    }

    const alreadyCancelled = sections.filter(
      (c) => c.status === MasterStatusEnum.CANCELLED,
    );

    if (alreadyCancelled.length > 0) {
      const controlNos = alreadyCancelled
        .map((c) => c.division_code)
        .join(', ');
      throw new BadRequestException(
        `The following Divisions are already RELEASED: ${controlNos}`,
      );
    }

    const nonActive = sections.filter(
      (c) => c.status !== MasterStatusEnum.ACTIVE,
    );

    if (nonActive.length > 0) {
      const controlNos = nonActive.map((c) => c.division_code).join(', ');
      throw new BadRequestException(
        `The following Divisions are not in ACTIVE status and cannot be CANCELLED: ${controlNos}`,
      );
    }

    await this.divisionRepository.bulkUpdate(ids, {
      status: MasterStatusEnum.CANCELLED,
      updated_by: causer,
      deleted_by: causer,
    });
  }
}
