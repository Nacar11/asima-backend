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
import { SellerMembersService } from '@/seller-members/seller-members.service';
import { CreateSellerMemberDto } from '@/seller-members/dto/create-seller-member.dto';
import { UpdateSellerMemberDto } from '@/seller-members/dto/update-seller-member.dto';
import { FindAllSellerMembersDto } from '@/seller-members/dto/find-all-seller-members.dto';
import { BulkUpdateStatusDto } from '@/seller-members/dto/bulk-update-status.dto';
import { SellerMember } from '@/seller-members/domain/seller-member';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

@ApiTags('Seller Members')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'seller-members',
  version: '1',
})
export class SellerMembersController {
  constructor(private readonly service: SellerMembersService) {}

  @Post()
  @ApiCreatedResponse({ type: SellerMember })
  create(@Body() dto: CreateSellerMemberDto, @CurrentUser() currentUser: User) {
    return this.service.create(dto, currentUser);
  }

  @Get()
  @ApiOkResponse({ type: SellerMember, isArray: true })
  async findAll(@Query() query: FindAllSellerMembersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const { data, totalCount } = await this.service.findAll(query);
    return { data, totalCount, page, limit };
  }

  @Patch('bulk-update-status')
  @ApiOkResponse({
    description: 'Bulk update status result',
    schema: {
      type: 'object',
      properties: {
        updated: { type: 'number' },
        failed: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  bulkUpdateStatus(
    @Body() dto: BulkUpdateStatusDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.bulkUpdateStatus(dto.ids, dto.status, currentUser);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: SellerMember })
  findOne(@Param('id') id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: SellerMember })
  update(
    @Param('id') id: number,
    @Body() dto: UpdateSellerMemberDto,
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
