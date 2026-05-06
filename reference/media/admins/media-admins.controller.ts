import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  SetMetadata,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { MediaAdminsService } from '@/media/admins/services/media-admins.service';
import { GetMediaDto } from '@/media/dto/get-media.dto';
import { UpdateMediaDto } from '@/media/dto/update-media.dto';
import { Media } from '@/media/domain/media';
import { JwtGuard } from '@/utils/guards/jwt.guard';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { LinkGlobalCategoryMediaDto } from '@/media/admins/dto/link-global-category-media.dto';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@ApiTags('Media - Admins')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller({
  path: 'admins/:admin_id/media',
  version: '1',
})
export class MediaAdminsController {
  constructor(private readonly mediaService: MediaAdminsService) {}

  private validateAdminOwnership(currentUser: User, adminId: number): void {
    if (!currentUser.system_admin || currentUser.id !== adminId) {
      throw new ForbiddenException(
        'You can only access media for your own admin account',
      );
    }
  }

  @Post('upload')
  @ApiOperation({
    summary: 'Upload media file(s) - supports single or multiple files',
  })
  @ApiParam({ name: 'admin_id', type: Number, example: 1 })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        title: { type: 'string', nullable: true },
        alt_text: { type: 'string', nullable: true },
        description: { type: 'string', nullable: true },
      },
      required: ['files'],
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiCreatedResponse({ type: Media, isArray: true })
  async uploadFile(
    @Param('admin_id', ParseIntPipe) adminId: number,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() currentUser: User,
    @Body('title') title?: string,
    @Body('alt_text') alt_text?: string,
    @Body('description') description?: string,
  ): Promise<Media[]> {
    this.validateAdminOwnership(currentUser, adminId);

    const uploadPromises: Array<Promise<Media>> = files.map((file) =>
      this.mediaService.uploadFile(file, {
        title,
        alt_text,
        description,
        admin_id: adminId,
      }),
    );

    return Promise.all(uploadPromises);
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Get all media for admin with search and pagination (Public)',
  })
  @ApiParam({ name: 'admin_id', type: Number, example: 1 })
  @ApiOkResponse({ type: Media, isArray: true })
  findAll(
    @Param('admin_id', ParseIntPipe) adminId: number,
    @Query() query: GetMediaDto,
  ) {
    return this.mediaService.findAll(adminId, query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get single media metadata by ID (Public)' })
  @ApiParam({ name: 'admin_id', type: Number, example: 1 })
  @ApiParam({ name: 'id', type: Number, example: 123 })
  @ApiOkResponse({ type: Media })
  findOne(
    @Param('admin_id', ParseIntPipe) adminId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.mediaService.findOne(adminId, id);
  }

  @Public()
  @Get(':id/view')
  @ApiOperation({ summary: 'Get media file URL (Public)' })
  @ApiParam({ name: 'admin_id', type: Number, example: 1 })
  @ApiParam({ name: 'id', type: Number, example: 123 })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
      },
    },
  })
  async viewMedia(
    @Param('admin_id', ParseIntPipe) adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const urlResponse: { url: string } =
      await this.mediaService.getMediaFileUrl(adminId, id);
    res.redirect(302, urlResponse.url);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update media metadata and/or replace file (admin owners only)',
  })
  @ApiParam({ name: 'admin_id', type: Number, example: 1 })
  @ApiParam({ name: 'id', type: Number, example: 123 })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', nullable: true },
        title: { type: 'string', nullable: true },
        alt_text: { type: 'string', nullable: true },
        description: { type: 'string', nullable: true },
        status: { type: 'string', nullable: true },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiOkResponse({ type: Media })
  update(
    @Param('admin_id', ParseIntPipe) adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('title') title?: string,
    @Body('alt_text') alt_text?: string,
    @Body('description') description?: string,
    @Body('status') status?: string,
  ) {
    this.validateAdminOwnership(currentUser, adminId);

    const updateDto: UpdateMediaDto = {
      ...(title !== undefined && { title }),
      ...(alt_text !== undefined && { alt_text }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status: status as any }),
    };

    return this.mediaService.update(adminId, id, updateDto, currentUser, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete media (soft delete)' })
  @ApiParam({ name: 'admin_id', type: Number, example: 1 })
  @ApiParam({ name: 'id', type: Number, example: 123 })
  @ApiNoContentResponse({ description: 'Media deleted successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('admin_id', ParseIntPipe) adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    this.validateAdminOwnership(currentUser, adminId);
    return this.mediaService.remove(adminId, id, currentUser);
  }

  @Post('category/:categoryId/link')
  @ApiOperation({
    summary:
      'Link an admin media item to a global category (sets category.media_id)',
  })
  @ApiParam({ name: 'admin_id', type: Number, example: 1 })
  @ApiParam({ name: 'categoryId', type: Number, example: 10 })
  @ApiBody({ type: LinkGlobalCategoryMediaDto })
  @ApiOkResponse({ description: 'Global category updated successfully' })
  @HttpCode(HttpStatus.OK)
  linkToGlobalCategory(
    @Param('admin_id', ParseIntPipe) adminId: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Body() dto: LinkGlobalCategoryMediaDto,
    @CurrentUser() currentUser: User,
  ) {
    this.validateAdminOwnership(currentUser, adminId);
    return this.mediaService.linkToGlobalCategory(
      adminId,
      categoryId,
      dto.media_id,
      currentUser,
    );
  }

  @Delete('category/:categoryId/unlink')
  @ApiOperation({
    summary:
      'Unlink media from a global category (sets category.media_id to null)',
  })
  @ApiParam({ name: 'admin_id', type: Number, example: 1 })
  @ApiParam({ name: 'categoryId', type: Number, example: 10 })
  @ApiOkResponse({ description: 'Global category updated successfully' })
  @HttpCode(HttpStatus.OK)
  unlinkFromGlobalCategory(
    @Param('admin_id', ParseIntPipe) adminId: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @CurrentUser() currentUser: User,
  ) {
    this.validateAdminOwnership(currentUser, adminId);
    return this.mediaService.unlinkFromGlobalCategory(categoryId, currentUser);
  }
}
