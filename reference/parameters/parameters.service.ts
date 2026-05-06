import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateParameterDto } from '@/parameters/dto/create-parameter.dto';
import { UpdateParameterDto } from '@/parameters/dto/update-parameter.dto';
import { BaseParametersRepository } from '@/parameters/persistence/base-parameters.repository';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { Parameter } from '@/parameters/domain/parameter';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';

@Injectable()
export class ParametersService {
  constructor(
    // Dependencies here
    private readonly parameterRepository: BaseParametersRepository,
  ) {}

  async create(createparametersDto: CreateParameterDto) {
    const existingParameterCode = await this.parameterRepository.findByCode(
      createparametersDto.code,
    );
    if (existingParameterCode) {
      throw new ConflictException('Parameter with this code already exists!');
    }
    return this.parameterRepository.create(createparametersDto);
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.parameterRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: Parameter['id']) {
    return this.parameterRepository.findById(id);
  }

  findByIds(ids: Parameter['id'][]) {
    return this.parameterRepository.findByIds(ids);
  }

  findAll() {
    return this.parameterRepository.findAll();
  }

  findByMany(queryParams: GetQueryParams) {
    const queryParamsParsed = {
      ...queryParams,
      filter:
        typeof queryParams?.filter === 'string'
          ? JSON.parse(queryParams.filter)
          : queryParams?.filter,
    };
    return this.parameterRepository.findManyBy(queryParamsParsed);
  }

  update(id: Parameter['id'], updateparametersDto: UpdateParameterDto) {
    // Do not remove comment below.
    // <updating-property />

    return this.parameterRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      ...updateparametersDto,
    });
  }

  async remove(id: Parameter['id']) {
    const parameters = await this.findById(id);

    if (!parameters) throw new NotFoundException('parameters does not exist!');

    await this.parameterRepository.remove(id);

    return {
      message: 'parameters deleted successfully',
      id,
    };
  }

  findByCode(code: Parameter['code']) {
    const existingParameterCode = this.parameterRepository.findByCode(code);

    if (!existingParameterCode) {
      throw new NotFoundException(
        `Parameter with code ${code} does not exist!`,
      );
    }

    return existingParameterCode;
  }

  findByItem(item: Parameter['param_items']) {
    const existingParameterItem =
      this.parameterRepository.findByParamItem(item);

    if (!existingParameterItem) {
      throw new NotFoundException(
        `Parameter with item ${item} does not exist!`,
      );
    }

    return existingParameterItem;
  }

  async checkFreeze() {
    return this.parameterRepository.checkFreeze();
  }
}
