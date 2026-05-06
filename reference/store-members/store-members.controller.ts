import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';
import { Permissions } from '@/user-permissions/persistence/user-permissions.decorator';
import { StoreMembersService } from './store-members.service';
import { CreateStoreMemberDto } from './dto/create-store-member.dto';
import { AssignStoreMemberDto } from './dto/assign-store-member.dto';
import { UpdateMemberGroupDto } from './dto/update-member-group.dto';
import { UpdateStoreMemberDto } from './dto/update-store-member.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { JwtPayloadType } from '@/auth/strategies/types/jwt-payload.type';

@ApiTags('Store Members')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({ path: 'store-members', version: '1' })
export class StoreMembersController {
  constructor(private readonly service: StoreMembersService) {}

  @Get()
  @Permissions({ SMB1: 'View' })
  findAll(@CurrentUser() user: JwtPayloadType) {
    return this.service.findAll(user);
  }

  @Get(':id')
  @Permissions({ SMB1: 'View' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayloadType,
  ) {
    return this.service.findOne(id, user);
  }

  @Post('assign')
  @Permissions({ SMB1: 'Create' })
  assignMember(
    @Body() dto: AssignStoreMemberDto,
    @CurrentUser() user: JwtPayloadType,
  ) {
    return this.service.assignMember(dto, user);
  }

  @Post('create')
  @Permissions({ SMB1: 'Create' })
  createMember(
    @Body() dto: CreateStoreMemberDto,
    @CurrentUser() user: JwtPayloadType,
  ) {
    return this.service.createMember(dto, user);
  }

  @Patch(':id')
  @Permissions({ SMB1: 'Edit' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStoreMemberDto,
    @CurrentUser() user: JwtPayloadType,
  ) {
    return this.service.update(id, dto, user);
  }

  @Patch(':id/group')
  @Permissions({ SMB1: 'Edit' })
  updateMemberGroup(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMemberGroupDto,
    @CurrentUser() user: JwtPayloadType,
  ) {
    return this.service.updateMemberGroup(id, dto, user);
  }

  @Delete(':id')
  @Permissions({ SMB1: 'Delete' })
  remove(@Param('id') id: number, @CurrentUser() user: JwtPayloadType) {
    return this.service.remove(id, user);
  }
}
