import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDocumentSignatoryDto } from '@/document-signatories/dto/create-document-signatory.dto';
import { UpdateDocumentSignatoryDto } from '@/document-signatories/dto/update-document-signatory.dto';
import { BaseDocumentSignatoryRepository } from '@/document-signatories/persistence/base-document-signatory.repository';
import { DocumentSignatory } from '@/document-signatories/domain/document-signatory';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { MasterStatusEnum } from '@/utils/enums/status-enum';
import { ClsService } from 'nestjs-cls';
import { DataSource } from 'typeorm';

@Injectable()
export class DocumentSignatoriesService {
  constructor(
    // Dependencies here
    private readonly _dataSource: DataSource,
    private readonly clsService: ClsService,
    private readonly documentSignatoryRepository: BaseDocumentSignatoryRepository,
  ) {}

  async create(createDocumentSignatoryDto: CreateDocumentSignatoryDto) {
    const existingMenuId = await this.documentSignatoryRepository.findByMenuId(
      Number(createDocumentSignatoryDto.menu),
    );

    if (existingMenuId) {
      throw new BadRequestException(
        `A Document Signatory with the menu code '${existingMenuId?.menu?.menu_code} / ${existingMenuId?.menu?.menu_name}' already exists.`,
      );
    }
    return this.documentSignatoryRepository.create({
      ...createDocumentSignatoryDto,
    });
  }

  findManyBy(queryParams: GetQueryParams) {
    const queryParamsParsed = {
      ...queryParams,
      filter: queryParams?.filter,
    };
    return this.documentSignatoryRepository.findManyBy(queryParamsParsed);
  }
  findById(id: DocumentSignatory['id']) {
    return this.documentSignatoryRepository.findById(id);
  }

  findByMenuCode(code: string) {
    return this.documentSignatoryRepository.findByMenuCode(code);
  }

  findByIds(ids: DocumentSignatory['id'][]) {
    return this.documentSignatoryRepository.findByIds(ids);
  }

  findAll() {
    return this.documentSignatoryRepository.findAll();
  }

  async bulkHold(ids: DocumentSignatory['id'][]) {
    const causer = this.clsService.get('currentUser');
    const documentSignatories =
      await this.documentSignatoryRepository.findByIds(ids);
    if (documentSignatories.length === 0) {
      throw new NotFoundException(
        'No DocumentSignatories found for the provided IDs.',
      );
    }

    const alreadyHold = documentSignatories.filter(
      (c) => c.status === MasterStatusEnum.HOLD,
    );

    if (alreadyHold.length > 0) {
      const controlNos = alreadyHold.map((ds) => ds.description).join(', ');
      throw new BadRequestException(
        `The following Document Signatories are already on HOLD: ${controlNos}`,
      );
    }

    const nonActive = documentSignatories.filter(
      (c) => c.status !== MasterStatusEnum.ACTIVE,
    );

    if (nonActive.length > 0) {
      const controlNos = nonActive.map((ds) => ds.description).join(', ');
      throw new BadRequestException(
        `The following Document Signatories are not in ACTIVE status and cannot be HOLD: ${controlNos}`,
      );
    }

    await this.documentSignatoryRepository.bulkUpdate(ids, {
      status: MasterStatusEnum.HOLD,
      updated_by: causer,
    });
  }

  async bulkRelease(ids: DocumentSignatory['id'][]) {
    const causer = this.clsService.get('currentUser');
    const documentSignatories =
      await this.documentSignatoryRepository.findByIds(ids);

    if (documentSignatories.length === 0) {
      throw new NotFoundException(
        'No Document Signatories found for the provided IDs.',
      );
    }

    const alreadyReleased = documentSignatories.filter(
      (c) => c.status === MasterStatusEnum.ACTIVE,
    );

    if (alreadyReleased.length > 0) {
      const controlNos = alreadyReleased.map((ds) => ds.description).join(', ');
      throw new BadRequestException(
        `The following Document Signatories are already RELEASED: ${controlNos}`,
      );
    }

    const nonActive = documentSignatories.filter(
      (c) => c.status !== MasterStatusEnum.HOLD,
    );

    if (nonActive.length > 0) {
      const controlNos = nonActive.map((c) => c.description).join(', ');
      throw new BadRequestException(
        `The following Document Signatories are not in HOLD status and cannot be RELEASED: ${controlNos}`,
      );
    }

    await this.documentSignatoryRepository.bulkUpdate(ids, {
      status: MasterStatusEnum.ACTIVE,
      updated_by: causer,
    });
  }

  async bulkDelete(ids: DocumentSignatory['id'][]) {
    const documentSignatories =
      await this.documentSignatoryRepository.findByIds(ids);
    const causer = this.clsService.get('currentUser');

    if (documentSignatories.length === 0) {
      throw new NotFoundException(
        'No Document Signatories found for the provided IDs.',
      );
    }

    const alreadyCancelled = documentSignatories.filter(
      (c) => c.status === MasterStatusEnum.CANCELLED,
    );

    if (alreadyCancelled.length > 0) {
      const descriptions = alreadyCancelled
        .map((ds) => ds.description)
        .join(', ');
      throw new BadRequestException(
        `The following Document Signatories are already RELEASED: ${descriptions}`,
      );
    }

    const nonActive = documentSignatories.filter(
      (c) => c.status !== MasterStatusEnum.ACTIVE,
    );

    if (nonActive.length > 0) {
      const descriptions = nonActive.map((c) => c.description).join(', ');
      throw new BadRequestException(
        `The following Document Signatories are not in ACTIVE status and cannot be CANCELLED: ${descriptions}`,
      );
    }

    await this.documentSignatoryRepository.bulkUpdate(ids, {
      status: MasterStatusEnum.CANCELLED,
      updated_by: causer,
      deleted_by: causer,
      deleted_at: new Date(),
    });
  }

  async update(
    id: DocumentSignatory['id'],
    updateDocumentSignatoryDto: UpdateDocumentSignatoryDto,
  ) {
    const documentSignatory = await this.findById(id);
    if (!documentSignatory)
      throw new NotFoundException('DocumentSignatory does not exist!');

    if (updateDocumentSignatoryDto.menu) {
      const existingMenuId =
        await this.documentSignatoryRepository.findByMenuId(
          Number(updateDocumentSignatoryDto.menu),
        );
      if (existingMenuId && existingMenuId.id !== id) {
        throw new BadRequestException(
          `A Document Signatory with the menu code '${existingMenuId?.menu?.menu_code} / ${existingMenuId?.menu?.menu_name}' already exists.`,
        );
      }
    }

    return this.documentSignatoryRepository.update(id, {
      ...updateDocumentSignatoryDto,
    });
  }

  async remove(id: DocumentSignatory['id']) {
    const documentSignatory = await this.findById(id);

    if (!documentSignatory)
      throw new NotFoundException('DocumentSignatory does not exist!');

    return this.documentSignatoryRepository.remove(id);
  }
}
