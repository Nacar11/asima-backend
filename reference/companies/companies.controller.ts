import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from '@/companies/dto/create-company.dto';
import { UpdateCompanyDto } from '@/companies/dto/update-company.dto';
import { Company } from '@/companies/domain/company';
import { PaginatedResponse } from '@/utils/dto/paginated-response.dto';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { JwtGuard } from '@/utils/guards/jwt.guard';
import { BulkActionCompaniesDto } from '@/companies/dto/bulk-action-companies.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from '@/users/domain/user';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller({
  path: 'companies',
  version: '1',
})
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('logo'))
  @ApiCreatedResponse({
    type: Company,
  })
  create(
    @Body() createCompanyDto: CreateCompanyDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() currentUser: User,
  ) {
    return this.companiesService.create(
      createCompanyDto,
      file ? [file] : [],
      currentUser,
    );
  }

  @Post(':id')
  @UseInterceptors(FileInterceptor('logo'))
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @ApiCreatedResponse({
    type: Company,
    description: 'Company created with ID successfully',
  })
  update(
    @Param('id') id: number,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() currentUser: User,
  ) {
    return this.companiesService.update(
      id,
      updateCompanyDto,
      file ? [file] : [],
      currentUser,
    );
  }

  @Get()
  @ApiOkResponse({
    type: PaginatedResponse(Company),
  })
  async findManyBy(
    @Query() query: GetQueryParams,
  ): Promise<{ data: Company[]; totalCount: number }> {
    return await this.companiesService.findManyBy(query);
  }

  @Get('/all')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: Company,
    isArray: true,
  })
  findAll() {
    return this.companiesService.findAll();
  }

  @Patch('bulk-hold')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description: 'Companies held successfully',
  })
  async bulkHold(@Body() bulkActionDto: BulkActionCompaniesDto): Promise<void> {
    await this.companiesService.bulkHold(bulkActionDto.ids);
  }

  @Patch('bulk-release')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description: 'Companies released successfully',
  })
  async bulkRelease(
    @Body() bulkActionDto: BulkActionCompaniesDto,
  ): Promise<void> {
    await this.companiesService.bulkRelease(bulkActionDto.ids);
  }

  @Patch('bulk-delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description: 'Companies deleted successfully',
  })
  async bulkRemove(
    @Body() bulkActionDto: BulkActionCompaniesDto,
  ): Promise<void> {
    await this.companiesService.bulkRemove(bulkActionDto.ids);
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: Company,
  })
  findById(@Param('id') id: number) {
    return this.companiesService.findById(id);
  }

  @Patch(':id/set-main')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Company set as main successfully',
    type: Company,
  })
  async setAsMain(@Param('id') id: string): Promise<Company> {
    return this.companiesService.setAsMain(+id);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description: 'Company deleted successfully',
  })
  remove(@Param('id') id: number) {
    return this.companiesService.remove(id);
  }
}
