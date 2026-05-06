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
  ApiNoContentResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AttachmentsService } from '@/attachments/attachments.service';
import { CreateAttachmentsDto } from '@/attachments/dto/create-attachments.dto';
import { UpdateAttachmentsDto } from '@/attachments/dto/update-attachments.dto';
import { FindAllAttachmentsDto } from '@/attachments/dto/find-all-attachments.dto';
import { Attachments } from '@/attachments/domain/attachments';
import {
  PaginatedResponseDto,
  PaginatedResponse,
} from '@/utils/dto/paginated-response.dto';
import { paginate } from '@/utils/paginate';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { BulkDeleteAttachmentsDto } from '@/attachments/dto/bulk-delete-attachments.dto';
import { FindByRecordIdAttachmentsDto } from '@/attachments/dto/find-by-record-id-attachment.dto';

@ApiTags('Attachments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'attachments',
  version: '1',
})
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post()
  @ApiCreatedResponse({
    type: Attachments,
  })
  create(
    @Body() createAttachmentsDto: CreateAttachmentsDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.attachmentsService.create(createAttachmentsDto, currentUser);
  }

  @Get()
  @ApiOkResponse({
    type: PaginatedResponse(Attachments),
  })
  async findAllWithPagination(
    @Query() query: FindAllAttachmentsDto,
  ): Promise<PaginatedResponseDto<Attachments>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 50;
    if (limit > 50) limit = 50;

    const results: IPaginatedResult<Attachments> =
      await this.attachmentsService.findAllWithPagination({
        paginationOptions: { page, limit },
      });

    return paginate(results, { page, limit });
  }

  @Get('/by-record/:record_id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: Attachments,
    isArray: true,
  })
  @ApiParam({
    name: 'record_id',
    type: Number,
    required: true,
  })
  attachmentByRecordId(
    @Param('record_id') record_id: number,
    @Query() query: FindByRecordIdAttachmentsDto,
  ) {
    const { record_type } = query;

    return this.attachmentsService.findByRecordIdAndType(
      record_id,
      record_type,
    );
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: Attachments,
  })
  findById(@Param('id') id: number) {
    return this.attachmentsService.findById(id);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: Attachments,
  })
  update(
    @Param('id') id: number,
    @Body() updateAttachmentsDto: UpdateAttachmentsDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.attachmentsService.update(
      id,
      updateAttachmentsDto,
      currentUser,
    );
  }

  @Delete('/bulk-delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Attachments successfully deleted!' })
  bulkDelete(
    @Query() query: BulkDeleteAttachmentsDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.attachmentsService.bulkRemove(query.ids, currentUser);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Attachment successfully deleted!' })
  remove(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.attachmentsService.remove(id, currentUser);
  }
}
