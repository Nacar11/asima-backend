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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { DocumentSignatoriesService } from './document-signatories.service';
import { CreateDocumentSignatoryDto } from '@/document-signatories/dto/create-document-signatory.dto';
import { UpdateDocumentSignatoryDto } from '@/document-signatories/dto/update-document-signatory.dto';
import { DocumentSignatory } from '@/document-signatories/domain/document-signatory';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';

import { PaginatedResponse } from '@/utils/dto/paginated-response.dto';
import { JwtGuard } from '@/utils/guards/jwt.guard';
import { BulkActionDto } from '@/utils/dto/bulk-action.dto';

@ApiTags('DocumentSignatories')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller({
  path: 'document-signatories',
  version: '1',
})
export class DocumentSignatoriesController {
  constructor(
    private readonly documentSignatoriesService: DocumentSignatoriesService,
  ) {}

  @Post()
  @ApiCreatedResponse({
    type: DocumentSignatory,
  })
  create(@Body() createDocumentSignatoryDto: CreateDocumentSignatoryDto) {
    return this.documentSignatoriesService.create(createDocumentSignatoryDto);
  }

  @Get()
  @ApiOkResponse({
    type: PaginatedResponse(DocumentSignatory),
  })
  async findManyBy(
    @Query() query: GetQueryParams,
  ): Promise<{ data: DocumentSignatory[]; totalCount: number }> {
    return await this.documentSignatoriesService.findManyBy(query);
  }

  @Get('/all')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: DocumentSignatory,
    isArray: true,
  })
  findAll() {
    return this.documentSignatoriesService.findAll();
  }

  @Get('/menu/:code')
  @ApiParam({
    name: 'code',
    type: String,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: DocumentSignatory,
  })
  findByMenuCode(@Param('code') code: string) {
    return this.documentSignatoriesService.findByMenuCode(code);
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: DocumentSignatory,
  })
  findById(@Param('id') id: number) {
    return this.documentSignatoriesService.findById(id);
  }

  @Patch('/bulk-hold')
  @HttpCode(HttpStatus.OK)
  @ApiNoContentResponse({
    description: 'Document Signatories successfully put on hold!',
  })
  bulkHold(@Body() bulkHoldGRDto: BulkActionDto) {
    return this.documentSignatoriesService.bulkHold(bulkHoldGRDto.ids);
  }

  @Patch('/bulk-release')
  @HttpCode(HttpStatus.OK)
  @ApiNoContentResponse({
    description: 'Document Signatories successfully released!',
  })
  bulkRelease(@Body() bulkReleaseDto: BulkActionDto) {
    return this.documentSignatoriesService.bulkRelease(bulkReleaseDto.ids);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: DocumentSignatory,
  })
  update(
    @Param('id') id: number,
    @Body() updateDocumentSignatoryDto: UpdateDocumentSignatoryDto,
  ) {
    return this.documentSignatoriesService.update(
      id,
      updateDocumentSignatoryDto,
    );
  }

  @Delete('/bulk-delete')
  @HttpCode(HttpStatus.OK)
  @ApiNoContentResponse({
    description: 'Document Signatories successfully deleted!',
  })
  bulkDelete(@Body() bulkDeleteDto: BulkActionDto) {
    return this.documentSignatoriesService.bulkDelete(bulkDeleteDto.ids);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  remove(@Param('id') id: number) {
    return this.documentSignatoriesService.remove(id);
  }
}
