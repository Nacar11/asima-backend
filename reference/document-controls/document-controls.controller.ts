import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { DocumentControlsService } from './document-controls.service';
import { CreateDocumentControlDto } from '@/document-controls/dto/create-document-control.dto';
import { UpdateDocumentControlDto } from '@/document-controls/dto/update-document-control.dto';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { DocumentControl } from '@/document-controls/domain/document-control';
import { PaginatedResponse } from '@/utils/dto/paginated-response.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from '@/utils/guards/jwt.guard';
import { BulkActionDto } from '@/utils/dto/bulk-action.dto';

@ApiTags('DocumentControl')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller({
  path: 'document-controls',
  version: '1',
})
export class DocumentControlsController {
  constructor(
    private readonly documentControlsService: DocumentControlsService,
  ) {}

  @Post()
  @ApiCreatedResponse({
    type: DocumentControl,
  })
  create(@Body() createDocumentControlDto: CreateDocumentControlDto) {
    return this.documentControlsService.create(createDocumentControlDto);
  }

  @Get()
  @ApiOkResponse({
    type: PaginatedResponse(DocumentControl),
  })
  async findManyBy(
    @Query() query: GetQueryParams,
  ): Promise<{ data: DocumentControl[]; totalCount: number }> {
    return await this.documentControlsService.findManyBy(query);
  }

  @Get('/all')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: DocumentControl,
    isArray: true,
  })
  findAll() {
    return this.documentControlsService.findAll();
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: DocumentControl,
  })
  findById(@Param('id') id: number) {
    return this.documentControlsService.findById(id);
  }

  @Patch(':id/hold')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Document Control successfully put on hold!',
  })
  hold(@Param('id') id: number) {
    return this.documentControlsService.bulkHold([id]);
  }

  @Patch('/bulk-hold')
  @HttpCode(HttpStatus.OK)
  @ApiNoContentResponse({
    description: 'Document Signatories successfully put on hold!',
  })
  bulkHold(@Body() bulkHoldGRDto: BulkActionDto) {
    return this.documentControlsService.bulkHold(bulkHoldGRDto.ids);
  }

  @Patch(':id/release')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Document Control successfully released!',
  })
  release(@Param('id') id: number) {
    return this.documentControlsService.bulkRelease([id]);
  }

  @Patch('/bulk-release')
  @HttpCode(HttpStatus.OK)
  @ApiNoContentResponse({
    description: 'Document Signatories successfully released!',
  })
  bulkRelease(@Body() bulkReleaseDto: BulkActionDto) {
    return this.documentControlsService.bulkRelease(bulkReleaseDto.ids);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: number,
    @Body() updateDocumentControlDto: UpdateDocumentControlDto,
  ) {
    return this.documentControlsService.update(id, updateDocumentControlDto);
  }

  @Delete('/bulk-delete')
  @HttpCode(HttpStatus.OK)
  @ApiNoContentResponse({
    description: 'Document Controls successfully deleted!',
  })
  bulkDelete(@Body() bulkDeleteDto: BulkActionDto) {
    return this.documentControlsService.bulkDelete(bulkDeleteDto.ids);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  remove(@Param('id') id: number) {
    return this.documentControlsService.remove(id);
  }
}
