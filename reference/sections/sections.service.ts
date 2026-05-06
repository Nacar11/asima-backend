import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import { CreateSectionDto } from '@/sections/dto/create-section.dto';
import { UpdateSectionDto } from '@/sections/dto/update-section.dto';
import { BaseSectionRepository } from '@/sections/persistence/base-section.repository';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { Section } from '@/sections/domain/section';
import { UsersService } from '@/users/users.service';
import { User } from '@/users/domain/user';
import { FindAllSectionsDto } from '@/sections/dto/find-all-sections.dto';
import { MasterStatusEnum, StatusEnum } from '@/utils/enums/status-enum';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class SectionsService {
  constructor(
    private readonly sectionRepository: BaseSectionRepository,
    private readonly usersService: UsersService,
    private readonly clsService: ClsService,
  ) {}

  async create(createSectionDto: CreateSectionDto, causer: User) {
    // check if code already exist
    const section = await this.sectionRepository.findByCode(
      createSectionDto.section_code,
    );

    if (section)
      throw new UnprocessableEntityException('Section code already exist!');

    const section_head = await this.usersService.findById(
      createSectionDto.section_head,
    );

    if (!section_head)
      throw new NotFoundException('Section head does not exist!');

    return this.sectionRepository.create({
      section_head,
      section_code: createSectionDto.section_code,
      section_name: createSectionDto.section_name,
      status: createSectionDto.status ?? StatusEnum.ACTIVE,
      created_by: causer,
      updated_by: causer,
    });
  }

  findByMany(queryParams: GetQueryParams) {
    const queryParamsParsed = {
      ...queryParams,
      filter: queryParams?.filter,
    };
    return this.sectionRepository.findByMany(queryParamsParsed);
  }

  findAllWithPagination({
    filterQuery,
    paginationOptions,
  }: {
    filterQuery: FindAllSectionsDto['search'];
    paginationOptions: IPaginationOptions;
  }) {
    return this.sectionRepository.findAllWithPagination({
      filterQuery,
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  async findById(id: Section['id']) {
    const section = await this.sectionRepository.findById(id);

    if (!section) throw new NotFoundException('Section does not exist!');

    return section;
  }

  findByIds(ids: Section['id'][]) {
    return this.sectionRepository.findByIds(ids);
  }

  findByCode(code: Section['section_code']) {
    return this.sectionRepository.findByCode(code);
  }

  findAll() {
    return this.sectionRepository.findAll();
  }

  async findDistinct() {
    const sections = await this.sectionRepository.findDistinct();
    return sections.map((section) => section.section_name);
  }

  async update(
    id: Section['id'],
    updateSectionDto: UpdateSectionDto,
    causer: User,
  ): Promise<Section> {
    const section = await this.findById(id);
    const partialSection: Partial<Section> = new Section();

    if (!section) throw new NotFoundException('Section does not exist!');

    Object.assign(partialSection, updateSectionDto);

    // check if code already exist
    if (
      updateSectionDto.section_code &&
      updateSectionDto.section_code != section.section_code
    ) {
      const sectionCode = await this.sectionRepository.findByCode(
        updateSectionDto.section_code,
      );

      if (sectionCode)
        throw new UnprocessableEntityException('Section code already exist!');
    }

    if (updateSectionDto.section_head) {
      const sectionHead = await this.usersService.findById(
        updateSectionDto.section_head,
      );

      if (!sectionHead)
        throw new NotFoundException('Section head does not exist!');

      partialSection.section_head = sectionHead;
    }

    partialSection.updated_by = causer;

    return this.sectionRepository.update(id, partialSection);
  }

  async remove(id: Section['id'], causer: User) {
    const section = await this.findById(id);

    if (!section) throw new NotFoundException('Section does not exist!');

    await this.sectionRepository.remove(id, causer);
  }

  /**
   * Update the status of a section
   * @param id - Section ID
   * @param status - New status (Active, Hold, Cancelled)
   * @param causer - User performing the action
   * @returns Updated section
   */
  async updateStatus(
    id: Section['id'],
    status: StatusEnum,
    causer: User,
  ): Promise<Section> {
    const section = await this.findById(id);

    if (!section) {
      throw new NotFoundException('Section does not exist!');
    }

    return this.sectionRepository.update(id, {
      status,
      updated_by: causer,
    });
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
    return await this.sectionRepository.lookup(queryParamsParsed, exclude);
  }

  async lookupById(id: number) {
    const result = await this.findById(id);
    return {
      id: result?.id,
      code: result?.section_code,
      name: result?.section_name,
    };
  }

  async bulkHold(ids: Section['id'][]) {
    const causer = this.clsService.get('currentUser');
    const sections = await this.sectionRepository.findByIds(ids);
    if (sections.length === 0) {
      throw new NotFoundException('No sections found for the provided IDs.');
    }

    const alreadyHold = sections.filter(
      (c) => c.status === MasterStatusEnum.HOLD,
    );

    if (alreadyHold.length > 0) {
      const controlNos = alreadyHold.map((c) => c.section_code).join(', ');
      throw new BadRequestException(
        `The following Sections are already on HOLD: ${controlNos}`,
      );
    }

    const nonActive = sections.filter(
      (c) => c.status !== MasterStatusEnum.ACTIVE,
    );

    if (nonActive.length > 0) {
      const controlNos = nonActive.map((c) => c.section_code).join(', ');
      throw new BadRequestException(
        `The following Sections are not in ACTIVE status and cannot be HOLD: ${controlNos}`,
      );
    }

    await this.sectionRepository.bulkUpdate(ids, {
      status: MasterStatusEnum.HOLD,
      updated_by: causer,
    });
  }

  async bulkRelease(ids: Section['id'][]) {
    const causer = this.clsService.get('currentUser');
    const sections = await this.sectionRepository.findByIds(ids);

    if (sections.length === 0) {
      throw new NotFoundException('No sections found for the provided IDs.');
    }

    const alreadyReleased = sections.filter(
      (c) => c.status === MasterStatusEnum.ACTIVE,
    );

    if (alreadyReleased.length > 0) {
      const controlNos = alreadyReleased.map((c) => c.section_code).join(', ');
      throw new BadRequestException(
        `The following Sections are already RELEASED: ${controlNos}`,
      );
    }

    const nonActive = sections.filter(
      (c) => c.status !== MasterStatusEnum.HOLD,
    );

    if (nonActive.length > 0) {
      const controlNos = nonActive.map((c) => c.section_code).join(', ');
      throw new BadRequestException(
        `The following Sections are not in HOLD status and cannot be RELEASED: ${controlNos}`,
      );
    }

    await this.sectionRepository.bulkUpdate(ids, {
      status: MasterStatusEnum.ACTIVE,
      updated_by: causer,
    });
  }

  async bulkDelete(ids: Section['id'][]) {
    const sections = await this.sectionRepository.findByIds(ids);
    const causer = this.clsService.get('currentUser');

    if (sections.length === 0) {
      throw new NotFoundException('No sections found for the provided IDs.');
    }

    const alreadyCancelled = sections.filter(
      (c) => c.status === MasterStatusEnum.CANCELLED,
    );

    if (alreadyCancelled.length > 0) {
      const controlNos = alreadyCancelled.map((c) => c.section_code).join(', ');
      throw new BadRequestException(
        `The following Sections are already RELEASED: ${controlNos}`,
      );
    }

    const nonActive = sections.filter(
      (c) => c.status !== MasterStatusEnum.ACTIVE,
    );

    if (nonActive.length > 0) {
      const controlNos = nonActive.map((c) => c.section_code).join(', ');
      throw new BadRequestException(
        `The following Sections are not in ACTIVE status and cannot be CANCELLED: ${controlNos}`,
      );
    }

    await this.sectionRepository.bulkUpdate(ids, {
      status: MasterStatusEnum.CANCELLED,
      updated_by: causer,
      deleted_by: causer,
    });
  }
}
