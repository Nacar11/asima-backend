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
import { SellerMemberServicesService } from '@/seller-member-services/seller-member-services.service';
import { CreateSellerMemberServiceDto } from '@/seller-member-services/dto/create-seller-member-service.dto';
import { UpdateSellerMemberServiceDto } from '@/seller-member-services/dto/update-seller-member-service.dto';
import { SellerMemberService as SellerMemberServiceModel } from '@/seller-member-services/domain/seller-member-service';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

@ApiTags('Seller Member Services')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'seller-member-services',
  version: '1',
})
export class SellerMemberServicesController {
  constructor(private readonly service: SellerMemberServicesService) {}

  @Post()
  @ApiCreatedResponse({ type: SellerMemberServiceModel })
  create(
    @Body() dto: CreateSellerMemberServiceDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.create(dto, currentUser);
  }

  @Get()
  @ApiOkResponse({ type: SellerMemberServiceModel, isArray: true })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: SellerMemberServiceModel })
  findOne(@Param('id') id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: SellerMemberServiceModel })
  update(
    @Param('id') id: number,
    @Body() dto: UpdateSellerMemberServiceDto,
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
