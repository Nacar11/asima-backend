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
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ServiceMilestoneTemplatesService } from '@/service-milestone-templates/service-milestone-templates.service';
import { CreateServiceMilestoneTemplateDto } from '@/service-milestone-templates/dto/create-service-milestone-template.dto';
import { UpdateServiceMilestoneTemplateDto } from '@/service-milestone-templates/dto/update-service-milestone-template.dto';
import { QueryServiceMilestoneTemplateDto } from '@/service-milestone-templates/dto/query-service-milestone-template.dto';
import { ServiceMilestoneTemplate } from '@/service-milestone-templates/domain/service-milestone-template';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

@ApiTags('Service Milestone Templates')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'service-milestone-templates',
  version: '1',
})
export class ServiceMilestoneTemplatesController {
  constructor(private readonly service: ServiceMilestoneTemplatesService) {}

  @Post()
  @ApiCreatedResponse({ type: ServiceMilestoneTemplate })
  create(
    @Body() dto: CreateServiceMilestoneTemplateDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.create(dto, currentUser);
  }

  @Get()
  @ApiOkResponse({ type: ServiceMilestoneTemplate, isArray: true })
  async findAll(@Query() query: QueryServiceMilestoneTemplateDto) {
    const { data, totalCount } = await this.service.findAll(query);
    return { data, totalCount };
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ServiceMilestoneTemplate })
  findOne(@Param('id') id: number) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ServiceMilestoneTemplate })
  update(
    @Param('id') id: number,
    @Body() dto: UpdateServiceMilestoneTemplateDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.update(id, dto, currentUser);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.service.remove(id, currentUser);
  }
}
