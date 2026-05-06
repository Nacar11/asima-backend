import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateCompanyDto } from '@/companies/dto/create-company.dto';
import { UpdateCompanyDto } from '@/companies/dto/update-company.dto';
import { BaseCompanyRepository } from '@/companies/persistence/base-company.repository';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { Company } from '@/companies/domain/company';
import { ClsService } from 'nestjs-cls';
import { DataSource } from 'typeorm';
import { Transaction } from '@/utils/typeorm/decorators/transaction.decorator';
import { RecordTypeEnum } from '@/attachments/attachments.enum';
import { StorageService } from '@/storage/storage.service';
import { AttachmentsService } from '@/attachments/attachments.service';
import { User } from '@/users/domain/user';
import { MasterStatusEnum } from '@/utils/enums/status-enum';

@Injectable()
export class CompaniesService {
  constructor(
    // Dependencies here
    private readonly companyRepository: BaseCompanyRepository,
    private readonly _dataSource: DataSource,
    private readonly clsService: ClsService,
    private readonly storageService: StorageService,
    private readonly attachmentService: AttachmentsService,
  ) {}

  async create(
    createCompanyDto: CreateCompanyDto,
    files: Express.Multer.File[],
    currentUser: User,
  ) {
    const { company_name, short_name, tin } = createCompanyDto;

    if (!currentUser) {
      throw new UnauthorizedException('User is required');
    }

    if (files && files.length > 1) {
      throw new UnprocessableEntityException('Only one logo file is allowed');
    }

    const validations = [
      {
        fieldName: 'company_name',
        fieldValue: company_name,
        repositoryMethod: this.companyRepository.findByName.bind(
          this.companyRepository,
        ),
        errorMessage: 'Company name already exists',
      },
      {
        fieldName: 'short_name',
        fieldValue: short_name,
        repositoryMethod: this.companyRepository.findByShortName.bind(
          this.companyRepository,
        ),
        errorMessage: 'Short name already exists',
      },
    ];

    if (tin) {
      validations.push({
        fieldName: 'tin',
        fieldValue: tin,
        repositoryMethod: this.companyRepository.findByTin.bind(
          this.companyRepository,
        ),
        errorMessage: 'TIN already exists',
      });
    }

    await this.validateCompanyFieldsUnique(validations);

    const company = new Company();
    Object.assign(company, createCompanyDto, {
      created_by: currentUser,
      updated_by: currentUser,
    });

    const createdCompany = await this.companyRepository.create(company);

    if (files?.length > 0) {
      const logoFile = files[0];
      const filePath = `company-logos/${createdCompany.id}-${Date.now()}-${logoFile.originalname}`;
      const uploadResult = await this.storageService.put(logoFile, filePath);

      await this.companyRepository.update(createdCompany.id, {
        logo: uploadResult.url,
      });

      createdCompany.logo = uploadResult.url;

      await this.attachmentService.create(
        {
          record_id: createdCompany.id,
          record_type: RecordTypeEnum.COMPANY_LOGO,
          file_path: uploadResult.url,
        },
        currentUser,
      );
    }

    return createdCompany;
  }

  async update(
    id: number,
    updateCompanyDto: UpdateCompanyDto,
    files: Express.Multer.File[],
    currentUser: User,
  ) {
    const { company_name, short_name, tin } = updateCompanyDto;
    const existingCompanyById = await this.companyRepository.findById(id);

    if (!currentUser) {
      throw new UnauthorizedException('User is required');
    }

    if (!existingCompanyById) {
      throw new NotFoundException(`Company with ID ${id} does not exist`);
    }

    const validations = [
      {
        fieldName: 'company_name',
        fieldValue: company_name,
        repositoryMethod: async (value: string) => {
          const found = await this.companyRepository.findByName(value);
          return found && found.id !== id ? found : null;
        },
        errorMessage: 'Company name already exists',
      },
      {
        fieldName: 'short_name',
        fieldValue: short_name,
        repositoryMethod: async (value: string) => {
          const found = await this.companyRepository.findByShortName(value);
          return found && found.id !== id ? found : null;
        },
        errorMessage: 'Short name already exists',
      },
    ];

    if (tin) {
      validations.push({
        fieldName: 'tin',
        fieldValue: tin,
        repositoryMethod: async (value: string) => {
          const found = await this.companyRepository.findByTin(value);
          return found && found.id !== id ? found : null;
        },
        errorMessage: 'TIN already exists',
      });
    }

    await this.validateCompanyFieldsUnique(validations);

    const updatedCompany = await this.companyRepository.update(id, {
      ...updateCompanyDto,
      updated_by: currentUser,
    });

    if (files?.length > 0) {
      const logoFile = files[0];
      const filePath = `company-logos/${id}-${Date.now()}-${logoFile.originalname}`;
      const uploadResult = await this.storageService.put(logoFile, filePath);

      await this.companyRepository.update(id, {
        logo: uploadResult.url,
      });

      if (updatedCompany) {
        updatedCompany.logo = uploadResult.url;
      }

      await this.attachmentService.create(
        {
          record_id: id,
          record_type: RecordTypeEnum.COMPANY_LOGO,
          file_path: uploadResult.url,
        },
        currentUser,
      );
    }

    return updatedCompany;
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.companyRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findManyBy(options: GetQueryParams) {
    const queryParamsParsed = {
      ...options,
      filter:
        typeof options?.filter === 'string'
          ? JSON.parse(options.filter)
          : options?.filter,
    };
    return this.companyRepository.findManyBy(queryParamsParsed);
  }

  findById(id: Company['id']) {
    return this.companyRepository.findById(id);
  }

  findByIds(ids: Company['id'][]) {
    return this.companyRepository.findByIds(ids);
  }

  findAll() {
    return this.companyRepository.findAll();
  }

  async remove(id: Company['id']) {
    const company = await this.findById(id);
    const currentUser = this.clsService.get('currentUser');

    if (!currentUser) {
      throw new UnauthorizedException('User is required to cancel company');
    }

    if (!company) throw new NotFoundException('Company does not exist!');

    if (company.status === MasterStatusEnum.CANCELLED) {
      throw new UnprocessableEntityException('Company is already cancelled');
    }

    return this.companyRepository.update(id, {
      status: MasterStatusEnum.CANCELLED,
      updated_by: currentUser,
      deleted_by: currentUser,
      deleted_at: new Date(),
    });
  }

  @Transaction()
  async bulkRemove(ids: number[]): Promise<void> {
    await this.executeBulkOperation(
      ids,
      (ids) => this.companyRepository.bulkRemove(ids),
      'bulk remove',
    );
  }

  @Transaction()
  async bulkHold(ids: number[]): Promise<void> {
    await this.executeBulkOperation(
      ids,
      (ids) => this.companyRepository.bulkHold(ids),
      'bulk hold',
    );
  }

  @Transaction()
  async bulkRelease(ids: number[]): Promise<void> {
    await this.executeBulkOperation(
      ids,
      (ids) => this.companyRepository.bulkRelease(ids),
      'bulk release',
    );
  }

  @Transaction()
  async setAsMain(id: Company['id']): Promise<Company> {
    return await this.companyRepository.setAsMain(id);
  }

  private async validateCompanyFieldsUnique(
    validations: Array<{
      fieldName: string;
      fieldValue: string | undefined;
      repositoryMethod: (value: string) => Promise<Company | null>;
      errorMessage: string;
    }>,
  ): Promise<void> {
    const errors: Record<string, string> = {};

    await Promise.all(
      validations.map(
        async ({ fieldName, fieldValue, repositoryMethod, errorMessage }) => {
          if (!fieldValue) return;
          const existingCompany = await repositoryMethod(fieldValue);
          if (existingCompany) {
            errors[fieldName] = errorMessage;
          }
        },
      ),
    );

    if (Object.keys(errors).length > 0) {
      throw new UnprocessableEntityException({
        status: 422,
        errors,
      });
    }
  }

  private async executeBulkOperation(
    ids: number[],
    operation: (ids: number[]) => Promise<void>,
    operationName: string,
  ): Promise<void> {
    const causer = this.clsService.get('currentUser');

    if (!causer) {
      throw new UnauthorizedException(
        `User not found in context for ${operationName}`,
      );
    }

    await operation(ids);
  }
}
