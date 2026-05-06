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
import { ServiceGalleryService } from '@/service-gallery/service-gallery.service';
import { CreateServiceGalleryDto } from '@/service-gallery/dto/create-service-gallery.dto';
import { UpdateServiceGalleryDto } from '@/service-gallery/dto/update-service-gallery.dto';
import { QueryServiceGalleryDto } from '@/service-gallery/dto/query-service-gallery.dto';
import { ServiceGallery } from '@/service-gallery/domain/service-gallery';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

@ApiTags('Service Gallery')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'service-gallery',
  version: '1',
})
export class ServiceGalleryController {
  constructor(private readonly service: ServiceGalleryService) {}

  @Post()
  @ApiCreatedResponse({ type: ServiceGallery })
  create(
    @Body() dto: CreateServiceGalleryDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.create(dto, currentUser);
  }

  @Get()
  @ApiOkResponse({ type: ServiceGallery, isArray: true })
  async findAll(@Query() query: QueryServiceGalleryDto) {
    const { data, totalCount } = await this.service.findAll(query);
    return { data, totalCount };
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ServiceGallery })
  findOne(@Param('id') id: number) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ServiceGallery })
  update(
    @Param('id') id: number,
    @Body() dto: UpdateServiceGalleryDto,
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
