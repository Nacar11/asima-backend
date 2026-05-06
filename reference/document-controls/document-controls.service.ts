import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDocumentControlDto } from '@/document-controls/dto/create-document-control.dto';
import { UpdateDocumentControlDto } from '@/document-controls/dto/update-document-control.dto';
import { BaseDocumentControlRepository } from '@/document-controls/persistence/base-document-control.repository';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { DocumentControl } from '@/document-controls/domain/document-control';
import { ClsService } from 'nestjs-cls';
import { MasterStatusEnum } from '@/utils/enums/status-enum';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { DataSource } from 'typeorm';

@Injectable()
export class DocumentControlsService {
  async bulkUpdate(ids: number[], payload: Partial<DocumentControl>) {
    const causer = this.clsService.get('currentUser');
    return this.documentControlRepository.bulkUpdate(ids, {
      ...payload,
      updated_by: causer,
    });
  }
  constructor(
    // Dependencies here
    private readonly _dataSource: DataSource,
    private readonly documentControlRepository: BaseDocumentControlRepository,
    private readonly clsService: ClsService,
  ) {}

  async create(createDocumentControlDto: CreateDocumentControlDto) {
    // Do not remove comment below.
    // <creating-property />

    // Note: With ManyToOne relationship, multiple document controls can exist per menu
    // If you need to enforce uniqueness, add a unique constraint in the database
    // or implement business logic validation here

    // Uniqueness: ensure menu_id is unique
    if (createDocumentControlDto.menu_id) {
      const existing = await this.documentControlRepository.findByMenuId(
        createDocumentControlDto.menu_id,
      );
      if (existing) {
        throw new BadRequestException(
          'A Document Control for this Menu already exists',
        );
      }
    }

    const documentControl = new DocumentControl();
    Object.assign(documentControl, createDocumentControlDto);

    // Set default status if not provided
    if (!documentControl.status) {
      documentControl.status = MasterStatusEnum.ACTIVE;
    }

    // Set the created_by user
    const causer = this.clsService.get('currentUser');
    documentControl.created_by = causer;

    return this.documentControlRepository.create(
      // Do not remove comment below.
      // <creating-property-payload />
      documentControl,
    );
  }

  findManyBy(queryParams: GetQueryParams) {
    const queryParamsParsed = {
      ...queryParams,
      filter: queryParams?.filter,
    };
    return this.documentControlRepository.findManyBy(queryParamsParsed);
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.documentControlRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: DocumentControl['id']) {
    return this.documentControlRepository.findById(id);
  }

  findByIds(ids: DocumentControl['id'][]) {
    return this.documentControlRepository.findByIds(ids);
  }

  findAll() {
    return this.documentControlRepository.findAll();
  }

  async update(
    id: DocumentControl['id'],
    updateDocumentControlDto: UpdateDocumentControlDto,
  ) {
    // Do not remove comment below.
    // <updating-property />
    const documentControl = await this.findById(id);
    const documentControls: Partial<DocumentControl> = new DocumentControl();
    if (!documentControl) {
      throw new NotFoundException('Document control not exist');
    }
    const causer = this.clsService.get('currentUser');

    Object.assign(documentControls, updateDocumentControlDto);

    documentControls.updated_by = causer;

    return this.documentControlRepository.update(id, documentControls);
    // Do not remove comment below.
    // <updating-property-payload />
  }

  findByMenuCode(code: string) {
    return this.documentControlRepository.findByMenuCode(code);
  }

  async bulkHold(ids: DocumentControl['id'][]) {
    const causer = this.clsService.get('currentUser');
    const documentControls =
      await this.documentControlRepository.findByIds(ids);

    if (documentControls.length === 0) {
      throw new NotFoundException(
        'No Document Controls found for the provided IDs.',
      );
    }

    const alreadyHold = documentControls.filter(
      (c) => c.status === MasterStatusEnum.HOLD,
    );

    if (alreadyHold.length > 0) {
      const controlNos = alreadyHold.map((dc) => dc.prefix_pattern).join(', ');
      throw new BadRequestException(
        `The following Document Controls are already on HOLD: ${controlNos}`,
      );
    }

    const nonActive = documentControls.filter(
      (c) => c.status !== MasterStatusEnum.ACTIVE,
    );

    if (nonActive.length > 0) {
      const controlNos = nonActive.map((dc) => dc.prefix_pattern).join(', ');
      throw new BadRequestException(
        `The following Document Controls are not in ACTIVE status and cannot be HOLD: ${controlNos}`,
      );
    }

    await this.documentControlRepository.bulkUpdate(ids, {
      status: MasterStatusEnum.HOLD,
      updated_by: causer,
    });
  }

  async bulkRelease(ids: DocumentControl['id'][]) {
    ids = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
    const causer = this.clsService.get('currentUser');
    const documentControls =
      await this.documentControlRepository.findByIds(ids);

    if (documentControls.length === 0) {
      throw new NotFoundException(
        'No Document Controls found for the provided IDs.',
      );
    }

    const alreadyReleased = documentControls.filter(
      (c) => c.status === MasterStatusEnum.ACTIVE,
    );

    if (alreadyReleased.length > 0) {
      const controlNos = alreadyReleased
        .map((dc) => dc.prefix_pattern)
        .join(', ');
      throw new BadRequestException(
        `The following Document Controls are already RELEASED: ${controlNos}`,
      );
    }

    const nonActive = documentControls.filter(
      (c) => c.status !== MasterStatusEnum.HOLD,
    );

    if (nonActive.length > 0) {
      const controlNos = nonActive.map((dc) => dc.prefix_pattern).join(', ');
      throw new BadRequestException(
        `The following Document Controls are not in HOLD status and cannot be RELEASED: ${controlNos}`,
      );
    }

    await this.documentControlRepository.bulkUpdate(ids, {
      status: MasterStatusEnum.ACTIVE,
      updated_by: causer,
    });
  }

  async bulkDelete(ids: DocumentControl['id'][]) {
    ids = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
    const documentControls =
      await this.documentControlRepository.findByIds(ids);
    const causer = this.clsService.get('currentUser');

    if (documentControls.length === 0) {
      throw new NotFoundException(
        'No Document Controls found for the provided IDs.',
      );
    }

    const alreadyCancelled = documentControls.filter(
      (c) => c.status === MasterStatusEnum.CANCELLED,
    );

    if (alreadyCancelled.length > 0) {
      const descriptions = alreadyCancelled
        .map((dc) => dc.prefix_pattern)
        .join(', ');
      throw new BadRequestException(
        `The following Document Controls are already CANCELLED: ${descriptions}`,
      );
    }

    const nonActive = documentControls.filter(
      (c) => c.status !== MasterStatusEnum.ACTIVE,
    );

    if (nonActive.length > 0) {
      const descriptions = nonActive.map((dc) => dc.prefix_pattern).join(', ');
      throw new BadRequestException(
        `The following Document Controls are not in ACTIVE status and cannot be CANCELLED: ${descriptions}`,
      );
    }

    await this.documentControlRepository.bulkUpdate(ids, {
      status: MasterStatusEnum.CANCELLED,
      updated_by: causer,
      deleted_by: causer,
      deleted_at: new Date(),
    });
  }

  async remove(id: DocumentControl['id']) {
    const documentControl = await this.findById(id);

    if (!documentControl) {
      throw new NotFoundException('DocumentControl does not exist!');
    }
    const causer = this.clsService.get('currentUser');
    await this.documentControlRepository.update(id, {
      status: MasterStatusEnum.CANCELLED,
      deleted_by: causer,
    });
    return this.documentControlRepository.remove(id);
  }
}
