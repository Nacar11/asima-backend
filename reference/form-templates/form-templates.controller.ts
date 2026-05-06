import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { FormTemplatesService } from '@/form-templates/form-templates.service';
import { CreateFormTemplateDto } from '@/form-templates/dto/create-form-template.dto';
import { UpdateFormTemplateDto } from '@/form-templates/dto/update-form-template.dto';
import { QueryFormTemplateDto } from '@/form-templates/dto/query-form-template.dto';
import { ReorderFormTemplatesDto } from '@/form-templates/dto/reorder-form-templates.dto';
import { FormTemplate } from '@/form-templates/domain/form-template';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

@ApiTags('Form Templates')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'form-templates',
  version: '1',
})
export class FormTemplatesController {
  constructor(private readonly service: FormTemplatesService) {}

  @Post()
  @ApiCreatedResponse({ type: FormTemplate })
  create(@Body() dto: CreateFormTemplateDto, @CurrentUser() currentUser: User) {
    return this.service.create(dto, currentUser);
  }

  @Get()
  @ApiOkResponse({ type: FormTemplate, isArray: true })
  async findAll(@Query() query: QueryFormTemplateDto) {
    const { data, totalCount } = await this.service.findAll(query);
    return { data, totalCount };
  }

  @Get('by-service/:serviceId')
  @ApiParam({ name: 'serviceId', type: Number })
  @ApiOkResponse({ type: FormTemplate, isArray: true })
  findByService(@Param('serviceId') serviceId: number) {
    return this.service.findByServiceId(serviceId);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: FormTemplate })
  findOne(@Param('id') id: number) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: FormTemplate })
  update(
    @Param('id') id: number,
    @Body() dto: UpdateFormTemplateDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.update(id, dto, currentUser);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.service.remove(id, currentUser);
  }

  @Put('reorder')
  @ApiOperation({
    summary: 'Reorder form templates',
    description: 'Update the sequence order of multiple form templates',
  })
  @ApiOkResponse({ type: FormTemplate, isArray: true })
  async reorder(@Body() dto: ReorderFormTemplatesDto) {
    return await this.service.reorder(dto);
  }
}
