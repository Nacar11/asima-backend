import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import { CreateSubSectionDto } from '@/sub-sections/dto/create-sub-section.dto';
import { UpdateSubSectionDto } from '@/sub-sections/dto/update-sub-section.dto';
import { BaseSubSectionRepository } from '@/sub-sections/persistence/base-sub-section.repository';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { SubSection } from '@/sub-sections/domain/sub-section';
import { UsersService } from '@/users/users.service';
import { User } from '@/users/domain/user';
import { FindAllSubSectionsDto } from '@/sub-sections/dto/find-all-sub-sections.dto';
import { MasterStatusEnum, StatusEnum } from '@/utils/enums/status-enum';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class SubSectionsService {
  constructor(
    private readonly subSectionRepository: BaseSubSectionRepository,
    private readonly usersService: UsersService,
    private readonly clsService: ClsService,
  ) {}

  async create(createSubSectionDto: CreateSubSectionDto, causer: User) {
    // Do not remove comment below.
    // <creating-property />

    // check if code already exist
    const section = await this.subSectionRepository.findByCode(
      createSubSectionDto.sub_section_code,
    );

    if (section)
      throw new UnprocessableEntityException('SubSection code already exist!');

    const sub_section_head = await this.usersService.findById(
      createSubSectionDto.sub_section_head,
    );

    if (!sub_section_head)
      throw new NotFoundException('SubSection head does not exist!');

    return this.subSectionRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      sub_section_head,
      sub_section_code: createSubSectionDto.sub_section_code,
      sub_section_name: createSubSectionDto.sub_section_name,
      status: createSubSectionDto.status ?? StatusEnum.ACTIVE,
      created_by: causer,
      updated_by: causer,
    });
  }

  findByMany(queryParams: GetQueryParams) {
    const queryParamsParsed = {
      ...queryParams,
      filter: queryParams?.filter || [],
    };
    return this.subSectionRepository.findByMany(queryParamsParsed);
  }

  findAllWithPagination({
    filterQuery,
    paginationOptions,
  }: {
    filterQuery: FindAllSubSectionsDto['search'];
    paginationOptions: IPaginationOptions;
  }) {
    return this.subSectionRepository.findAllWithPagination({
      filterQuery,
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  async findById(id: SubSection['id']) {
    const subSection = await this.subSectionRepository.findById(id);

    if (!subSection) throw new NotFoundException('Sub SubSection not found');

    return subSection;
  }

  findByIds(ids: SubSection['id'][]) {
    return this.subSectionRepository.findByIds(ids);
  }

  findByCode(sub_section_code: SubSection['sub_section_code']) {
    return this.subSectionRepository.findByCode(sub_section_code);
  }

  findAll() {
    return this.subSectionRepository.findAll();
  }

  async findDistinct() {
    const sub_sections = await this.subSectionRepository.findDistinct();
    return sub_sections.map((sub_section) => sub_section.sub_section_name);
  }

  async update(
    id: SubSection['id'],
    updateSubSectionDto: UpdateSubSectionDto,
    causer: User,
  ): Promise<SubSection> {
    const subSection = await this.findById(id);
    const partialSubSection: Partial<SubSection> = new SubSection();

    if (!subSection) throw new NotFoundException('SubSection does not exist!');

    Object.assign(partialSubSection, updateSubSectionDto);

    // check if code already exist
    if (
      updateSubSectionDto.sub_section_code &&
      updateSubSectionDto.sub_section_code != subSection.sub_section_code
    ) {
      const subSectionCode = await this.subSectionRepository.findByCode(
        updateSubSectionDto.sub_section_code,
      );

      if (subSectionCode)
        throw new UnprocessableEntityException(
          'SubSection code already exist!',
        );
    }

    if (updateSubSectionDto.sub_section_head) {
      const subSectionHead = await this.usersService.findById(
        updateSubSectionDto.sub_section_head,
      );

      if (!subSectionHead)
        throw new NotFoundException('SubSection head does not exist!');

      partialSubSection.sub_section_head = subSectionHead;
    }

    partialSubSection.updated_by = causer;

    return this.subSectionRepository.update(id, partialSubSection);
  }

  async remove(id: SubSection['id'], causer: User) {
    const subSection = await this.findById(id);

    if (!subSection) throw new NotFoundException('SubSection does not exist!');

    await this.subSectionRepository.remove(id, causer);
  }

  /**
   * Update the status of a sub-section
   * @param id - Sub-section ID
   * @param status - New status (Active, Hold, Cancelled)
   * @param causer - User performing the action
   * @returns Updated sub-section
   */
  async updateStatus(
    id: SubSection['id'],
    status: StatusEnum,
    causer: User,
  ): Promise<SubSection> {
    const subSection = await this.findById(id);

    if (!subSection) {
      throw new NotFoundException('Sub-section does not exist!');
    }

    return this.subSectionRepository.update(id, {
      status,
      updated_by: causer,
    });
  }

  /**
   * Bulk delete multiple sub-sections
   * @param bulkDeleteDto - DTO containing array of sub-section IDs
   * @param causer - User performing the action
   * @returns Object with deleted count, failed count, and error details
   */

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
    return await this.subSectionRepository.lookup(queryParamsParsed, exclude);
  }

  async lookupById(id: number) {
    const result = await this.findById(id);
    return {
      id: result?.id,
      code: result?.sub_section_code,
      name: result?.sub_section_name,
    };
  }

  async bulkHold(ids: SubSection['id'][]) {
    const causer = this.clsService.get('currentUser');
    const sections = await this.subSectionRepository.findByIds(ids);
    if (sections.length === 0) {
      throw new NotFoundException('No sections found for the provided IDs.');
    }

    const alreadyHold = sections.filter(
      (c) => c.status === MasterStatusEnum.HOLD,
    );

    if (alreadyHold.length > 0) {
      const controlNos = alreadyHold.map((c) => c.sub_section_code).join(', ');
      throw new BadRequestException(
        `The following SubSections are already on HOLD: ${controlNos}`,
      );
    }

    const nonActive = sections.filter(
      (c) => c.status !== MasterStatusEnum.ACTIVE,
    );

    if (nonActive.length > 0) {
      const controlNos = nonActive.map((c) => c.sub_section_code).join(', ');
      throw new BadRequestException(
        `The following SubSections are not in ACTIVE status and cannot be HOLD: ${controlNos}`,
      );
    }

    await this.subSectionRepository.bulkUpdate(ids, {
      status: MasterStatusEnum.HOLD,
      updated_by: causer,
    });
  }

  async bulkRelease(ids: SubSection['id'][]) {
    const causer = this.clsService.get('currentUser');
    const sections = await this.subSectionRepository.findByIds(ids);

    if (sections.length === 0) {
      throw new NotFoundException('No sections found for the provided IDs.');
    }

    const alreadyReleased = sections.filter(
      (c) => c.status === MasterStatusEnum.ACTIVE,
    );

    if (alreadyReleased.length > 0) {
      const controlNos = alreadyReleased
        .map((c) => c.sub_section_code)
        .join(', ');
      throw new BadRequestException(
        `The following SubSections are already RELEASED: ${controlNos}`,
      );
    }

    const nonActive = sections.filter(
      (c) => c.status !== MasterStatusEnum.HOLD,
    );

    if (nonActive.length > 0) {
      const controlNos = nonActive.map((c) => c.sub_section_code).join(', ');
      throw new BadRequestException(
        `The following SubSections are not in HOLD status and cannot be RELEASED: ${controlNos}`,
      );
    }

    await this.subSectionRepository.bulkUpdate(ids, {
      status: MasterStatusEnum.ACTIVE,
      updated_by: causer,
    });
  }

  async bulkDelete(ids: SubSection['id'][]) {
    const sections = await this.subSectionRepository.findByIds(ids);
    const causer = this.clsService.get('currentUser');

    if (sections.length === 0) {
      throw new NotFoundException('No sections found for the provided IDs.');
    }

    const alreadyCancelled = sections.filter(
      (c) => c.status === MasterStatusEnum.CANCELLED,
    );

    if (alreadyCancelled.length > 0) {
      const controlNos = alreadyCancelled
        .map((c) => c.sub_section_code)
        .join(', ');
      throw new BadRequestException(
        `The following SubSections are already RELEASED: ${controlNos}`,
      );
    }

    const nonActive = sections.filter(
      (c) => c.status !== MasterStatusEnum.ACTIVE,
    );

    if (nonActive.length > 0) {
      const controlNos = nonActive.map((c) => c.sub_section_code).join(', ');
      throw new BadRequestException(
        `The following SubSections are not in ACTIVE status and cannot be CANCELLED: ${controlNos}`,
      );
    }

    await this.subSectionRepository.bulkUpdate(ids, {
      status: MasterStatusEnum.CANCELLED,
      updated_by: causer,
      deleted_by: causer,
    });
  }
}
