import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { EdistrictService } from '@/discovery/edistrict.service';
import { UpdateEdistrictStatusDto } from '@/discovery/dto/update-edistrict-status.dto';
import { CreateEdistrictDto } from '@/discovery/dto/create-edistrict.dto';
import { UpdateEdistrictDto } from '@/discovery/dto/update-edistrict.dto';
import { EdistrictAdminListItemDto } from '@/discovery/dto/edistrict-admin-list-item.dto';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';

@ApiTags('Admin - Edistricts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({ path: 'admin/edistricts', version: '1' })
export class AdminEdistrictController {
  constructor(private readonly edistrictService: EdistrictService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new edistrict' })
  @ApiCreatedResponse({ type: EdistrictAdminListItemDto })
  async create(
    @Body() dto: CreateEdistrictDto,
  ): Promise<EdistrictAdminListItemDto> {
    return this.edistrictService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all edistricts' })
  @ApiOkResponse({ type: [EdistrictAdminListItemDto] })
  async findAll(): Promise<EdistrictAdminListItemDto[]> {
    return this.edistrictService.findAllForAdmin();
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update edistrict details' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: EdistrictAdminListItemDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEdistrictDto,
  ): Promise<EdistrictAdminListItemDto> {
    return this.edistrictService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an edistrict' })
  @ApiParam({ name: 'id', type: Number })
  @ApiNoContentResponse()
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.edistrictService.delete(id);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Toggle edistrict active/inactive status' })
  @ApiParam({ name: 'id', type: Number })
  @ApiNoContentResponse()
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEdistrictStatusDto,
  ): Promise<void> {
    await this.edistrictService.updateStatus(id, dto.status);
  }
}
