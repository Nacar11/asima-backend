import { User } from '@/users/domain/user';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { MenusService } from './menus.service';
import { CreateMenuDto } from '@/menus/dto/create-menu.dto';
import { UpdateMenuDto } from '@/menus/dto/update-menu.dto';
import { FindAllMenusDto } from '@/menus/dto/find-all-menus.dto';
import { Menu } from '@/menus/domain/menu';
import {
  PaginatedResponseDto,
  PaginatedResponse,
} from '@/utils/dto/paginated-response.dto';
import { paginate } from '@/utils/paginate';
import { IPaginatedResult } from '@/utils/types/paginated-result';

@ApiTags('Menus')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'menus',
  version: '1',
})
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Post()
  @ApiCreatedResponse({
    type: Menu,
  })
  create(
    @Body() createMenuDto: CreateMenuDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.menusService.create(createMenuDto, currentUser);
  }

  @Get()
  @ApiOkResponse({
    type: PaginatedResponse(Menu),
  })
  async findAllWithPagination(
    @Query() query: FindAllMenusDto,
  ): Promise<PaginatedResponseDto<Menu>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 50;
    const status = query?.status ?? 'all';
    if (limit > 50) limit = 50;

    const results: IPaginatedResult<Menu> =
      await this.menusService.findAllWithPagination({
        filterSearch: query?.search,
        status: status,
        paginationOptions: { page, limit },
      });

    return paginate(results, { page, limit });
  }

  @Get('/all')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: Menu,
    isArray: true,
  })
  findAll() {
    return this.menusService.findAll();
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: Menu,
  })
  findById(@Param('id') id: number) {
    return this.menusService.findById(id);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: Menu,
  })
  update(
    @Param('id') id: number,
    @Body() updateMenuDto: UpdateMenuDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.menusService.update(id, updateMenuDto, currentUser);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  remove(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.menusService.remove(id, currentUser);
  }
}
