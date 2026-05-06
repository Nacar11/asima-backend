import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import { CreateDepartmentDto } from '@/departments/dto/create-department.dto';
import { UpdateDepartmentDto } from '@/departments/dto/update-department.dto';
import { BaseDepartmentRepository } from '@/departments/persistence/base-department.repository';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { Department } from '@/departments/domain/department';
import { User } from '@/users/domain/user';
import { UsersService } from '@/users/users.service';
import { FindAllDepartmentsDto } from '@/departments/dto/find-all-departments.dto';
import { StatusEnum } from '@/utils/enums/status-enum';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class DepartmentsService {
  constructor(
    // Dependencies here
    private readonly departmentRepository: BaseDepartmentRepository,
    private readonly usersService: UsersService,
    private readonly clsService: ClsService,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto, causer: User) {
    // check if code already exist
    const department = await this.departmentRepository.findByCode(
      createDepartmentDto.department_code,
    );

    if (department)
      throw new UnprocessableEntityException('Department code already exist!');

    const department_head = await this.usersService.findById(
      createDepartmentDto.department_head,
    );

    if (!department_head)
      throw new NotFoundException('Department head does not exist!');

    return this.departmentRepository.create({
      department_head,
      department_code: createDepartmentDto.department_code,
      department_name: createDepartmentDto.department_name,
      status: createDepartmentDto.status ?? StatusEnum.ACTIVE,
      created_by: causer,
      updated_by: causer,
    });
  }

  findByMany(queryParams: GetQueryParams) {
    const queryParamsParsed = {
      ...queryParams,
      filter: queryParams?.filter,
    };
    return this.departmentRepository.findByMany(queryParamsParsed);
  }

  findAllWithPagination({
    filterQuery,
    paginationOptions,
  }: {
    filterQuery: FindAllDepartmentsDto['search'];
    paginationOptions: IPaginationOptions;
  }) {
    return this.departmentRepository.findAllWithPagination({
      filterQuery,
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  async findById(id: Department['id']) {
    const department = await this.departmentRepository.findById(id);

    if (!department) throw new NotFoundException('Department does not exist!');

    return department;
  }

  findByIds(ids: Department['id'][]) {
    return this.departmentRepository.findByIds(ids);
  }

  findByCode(code: Department['department_code']) {
    return this.departmentRepository.findByCode(code);
  }

  findAll() {
    return this.departmentRepository.findAll();
  }

  async findDistinct() {
    const departments = await this.departmentRepository.findDistinct();
    return departments.map((department) => department.department_name);
  }

  async update(
    id: Department['id'],
    updateDepartmentDto: UpdateDepartmentDto,
    causer: User,
  ): Promise<Department> {
    const department = await this.findById(id);
    const partialDepartment: Partial<Department> = new Department();

    if (!department) throw new NotFoundException('Department does not exist!');

    Object.assign(partialDepartment, updateDepartmentDto);

    // check if code already exist
    if (
      updateDepartmentDto.department_code &&
      updateDepartmentDto.department_code != department.department_code
    ) {
      const departmentCode = await this.departmentRepository.findByCode(
        updateDepartmentDto.department_code,
      );

      if (departmentCode)
        throw new UnprocessableEntityException(
          'Department code already exist!',
        );
    }

    if (updateDepartmentDto.department_head) {
      const department_head = await this.usersService.findById(
        updateDepartmentDto.department_head,
      );

      if (!department_head)
        throw new NotFoundException('Department head does not exist!');

      partialDepartment.department_head = department_head;
    }

    partialDepartment.updated_by = causer;

    return this.departmentRepository.update(id, partialDepartment);
  }

  /**
   * Update department status
   *
   * Updates a department's status to the specified value. This method validates
   * the status and ensures the department exists before updating.
   *
   * @param id - The unique identifier of the department
   * @param status - The new status ('Active', 'Hold', or 'Cancelled')
   * @param causer - The user performing the status update
   * @returns Promise<Department> - The updated department
   *
   * @example
   * ```typescript
   * const department = await departmentsService.updateStatus(1, 'Hold', user);
   * // Updates department 1 status to 'Hold'
   * ```
   *
   * @throws {NotFoundException} When department with given ID does not exist
   * @throws {BadRequestException} When status is invalid
   */
  async updateStatus(
    id: number,
    status: 'Active' | 'Hold' | 'Cancelled',
    causer: User,
  ): Promise<Department> {
    // Validate status
    const validStatuses = ['Active', 'Hold', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`,
      );
    }

    // Get the department first to ensure it exists
    const department = await this.findById(id);
    if (!department) {
      throw new NotFoundException('Department does not exist!');
    }

    // Update the status using the existing update method
    const updateDto: UpdateDepartmentDto = {
      status: status as StatusEnum,
    };
    return this.update(id, updateDto, causer);
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
    return await this.departmentRepository.lookup(queryParamsParsed, exclude);
  }

  async lookupById(id: number) {
    const result = await this.findById(id);
    return {
      id: result?.id,
      department_code: result?.department_code,
      department_name: result?.department_name,
    };
  }

  async remove(id: Department['id'], causer: User) {
    const department = await this.findById(id);

    if (!department) throw new NotFoundException('Department does not exist!');

    await this.departmentRepository.remove(id, causer);
  }

  async bulkHold(ids: Department['id'][]) {
    const causer = this.clsService.get('currentUser');
    const departments = await this.departmentRepository.findByIds(ids);
    if (departments.length === 0) {
      throw new NotFoundException('No departments found for the provided IDs.');
    }

    const alreadyHold = departments.filter((c) => c.status === StatusEnum.HOLD);

    if (alreadyHold.length > 0) {
      const controlNos = alreadyHold.map((c) => c.department_code).join(', ');
      throw new BadRequestException(
        `The following Departments are already on HOLD: ${controlNos}`,
      );
    }

    const nonActive = departments.filter((c) => c.status !== StatusEnum.ACTIVE);

    if (nonActive.length > 0) {
      const controlNos = nonActive.map((c) => c.department_code).join(', ');
      throw new BadRequestException(
        `The following Departments are not in ACTIVE status and cannot be HOLD: ${controlNos}`,
      );
    }

    await this.departmentRepository.bulkUpdate(ids, {
      status: StatusEnum.HOLD,
      updated_by: causer,
    });
  }

  async bulkRelease(ids: Department['id'][]) {
    const causer = this.clsService.get('currentUser');
    const departments = await this.departmentRepository.findByIds(ids);

    if (departments.length === 0) {
      throw new NotFoundException('No departments found for the provided IDs.');
    }

    const alreadyReleased = departments.filter(
      (c) => c.status === StatusEnum.ACTIVE,
    );

    if (alreadyReleased.length > 0) {
      const controlNos = alreadyReleased
        .map((c) => c.department_code)
        .join(', ');
      throw new BadRequestException(
        `The following Departments are already RELEASED: ${controlNos}`,
      );
    }

    const nonActive = departments.filter((c) => c.status !== StatusEnum.HOLD);

    if (nonActive.length > 0) {
      const controlNos = nonActive.map((c) => c.department_code).join(', ');
      throw new BadRequestException(
        `The following Departments are not in HOLD status and cannot be RELEASED: ${controlNos}`,
      );
    }

    await this.departmentRepository.bulkUpdate(ids, {
      status: StatusEnum.ACTIVE,
      updated_by: causer,
    });
  }

  async bulkDelete(ids: Department['id'][]) {
    const departments = await this.departmentRepository.findByIds(ids);
    const causer = this.clsService.get('currentUser');

    if (departments.length === 0) {
      throw new NotFoundException('No departments found for the provided IDs.');
    }

    const alreadyCancelled = departments.filter(
      (c) => c.status === StatusEnum.CANCELLED,
    );

    if (alreadyCancelled.length > 0) {
      const controlNos = alreadyCancelled
        .map((c) => c.department_code)
        .join(', ');
      throw new BadRequestException(
        `The following Departments are already RELEASED: ${controlNos}`,
      );
    }

    const nonActive = departments.filter((c) => c.status !== StatusEnum.ACTIVE);

    if (nonActive.length > 0) {
      const controlNos = nonActive.map((c) => c.department_code).join(', ');
      throw new BadRequestException(
        `The following Departments are not in ACTIVE status and cannot be CANCELLED: ${controlNos}`,
      );
    }

    await this.departmentRepository.bulkUpdate(ids, {
      status: StatusEnum.CANCELLED,
      updated_by: causer,
      deleted_by: causer,
    });
  }
}
