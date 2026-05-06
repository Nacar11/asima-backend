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
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ForbiddenException,
  SetMetadata,
  Res,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { MediaSellersService } from '@/media/sellers/services/media-sellers.service';
import { UpdateMediaDto } from '@/media/dto/update-media.dto';
import { GetMediaDto } from '@/media/dto/get-media.dto';
import { LinkMediaDto } from '@/media/dto/link-media.dto';
import { UpdateMediaMappingDto } from '@/media/dto/update-media-mapping.dto';
import { ReorderMediaDto } from '@/media/dto/reorder-media.dto';
import { SyncPrimaryImageDto } from '@/media/dto/sync-primary-image.dto';
import { SyncProductImagesDto } from '@/media/dto/sync-product-images.dto';
import { Media } from '@/media/domain/media';
import { JwtGuard } from '@/utils/guards/jwt.guard';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';
import { Permissions } from '@/user-permissions/persistence/user-permissions.decorator';

// Decorator to mark routes as public (skip JWT authentication)
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Media Controller
 * Handles seller-scoped media operations
 * Route: /api/v1/sellers/:seller_id/media
 *
 * All media is public and can be used by all sellers.
 */
@ApiTags('Media - Sellers')
@ApiBearerAuth()
@UseGuards(JwtGuard, PermissionsGuard)
@Controller({
  path: 'sellers/:seller_id/media',
  version: '1',
})
export class MediaSellersController {
  constructor(private readonly mediaService: MediaSellersService) {}

  /**
   * Validates that the current user owns the seller or is a system admin
   */
  private validateSellerOwnership(currentUser: User, sellerId: number): void {
    if (!currentUser.system_admin && currentUser.seller_id !== sellerId) {
      throw new ForbiddenException(
        'You can only access media for your own seller account',
      );
    }
  }

  @Post('upload')
  @Permissions({ AC02: 'Create' })
  @ApiOperation({
    summary: 'Upload media file(s) - supports single or multiple files',
    description:
      'Upload one or more image/video files for a seller. Files are stored in S3/MinIO with automatic path organization by store name and media type. Maximum 10 files per request.',
  })
  @ApiParam({
    name: 'seller_id',
    type: Number,
    description: 'ID of the seller uploading the media',
    example: 1,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload media files with optional metadata',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Image or video files (max 10)',
        },
        title: {
          type: 'string',
          nullable: true,
          description: 'Media title',
          example: 'Product Image - Front View',
        },
        alt_text: {
          type: 'string',
          nullable: true,
          description: 'Alternative text for accessibility',
          example: 'Product front view',
        },
        description: {
          type: 'string',
          nullable: true,
          description: 'Media description',
          example: 'High quality product image showing details',
        },
      },
      required: ['files'],
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiCreatedResponse({
    description: 'Media file(s) uploaded successfully',
    type: Media,
    isArray: true,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid file type or missing files',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not seller owner' })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Seller does not exist',
  })
  async uploadFile(
    @Param('seller_id', ParseIntPipe) sellerId: number,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() currentUser: User,
    @Body('title') title?: string,
    @Body('alt_text') alt_text?: string,
    @Body('description') description?: string,
  ) {
    this.validateSellerOwnership(currentUser, sellerId);

    const uploadPromises = files.map((file) =>
      this.mediaService.uploadFile(file, {
        title,
        alt_text,
        description,
        seller_id: sellerId,
      }),
    );

    return Promise.all(uploadPromises);
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Get all media for seller with search and pagination (Public)',
    description:
      'Retrieve media files for a seller. All media is public and includes both images and videos. Supports search across filename, title, alt text, and description with sorting and pagination.',
  })
  @ApiParam({
    name: 'seller_id',
    type: Number,
    description: 'ID of the seller',
    example: 1,
  })
  @ApiOkResponse({
    description: 'List of media files retrieved successfully',
    type: Media,
    isArray: true,
  })
  findAll(
    @Param('seller_id', ParseIntPipe) sellerId: number,
    @Query() query: GetMediaDto,
  ) {
    // All media is public
    return this.mediaService.findAll(sellerId, query);
  }

  @Public()
  @Get(':id/view')
  @ApiOperation({
    summary: 'Get media file URL (Public)',
    description:
      'Returns a direct MinIO URL to access the media file. All media is public.',
  })
  @ApiParam({
    name: 'seller_id',
    type: Number,
    description: 'ID of the seller',
    example: 1,
  })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
    description: 'ID of the media file',
    example: 123,
  })
  @ApiOkResponse({
    description: 'Media file URL',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example: 'http://localhost:9002/media/path/to/file.jpg',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Media not found' })
  async viewMedia(
    @Param('seller_id', ParseIntPipe) sellerId: number,
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const urlResponse = await this.mediaService.getMediaFileUrl(sellerId, id);

    // Redirect to the actual file URL (MinIO direct or presigned)
    res.redirect(302, urlResponse.url);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Get single media metadata by ID (Public)',
    description:
      'Retrieve metadata for a specific media file by ID. All media is public.',
  })
  @ApiParam({
    name: 'seller_id',
    type: Number,
    description: 'ID of the seller',
    example: 1,
  })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
    description: 'ID of the media file',
    example: 123,
  })
  @ApiOkResponse({
    description: 'Media file metadata retrieved successfully',
    type: Media,
  })
  @ApiResponse({ status: 404, description: 'Media not found' })
  findOne(
    @Param('seller_id', ParseIntPipe) sellerId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.mediaService.findOne(sellerId, id);
  }

  @Patch('link')
  @Permissions({ AC02: 'Edit' })
  @ApiOperation({
    summary: 'Update media mapping (reorder or set primary)',
    description:
      'Update media mappings. Supports two modes:\n\n' +
      '**Single update**: Use `media_id` with `display_order` and/or `is_primary`\n' +
      '**Bulk reorder**: Use `media_ids` array - the order in the array determines `display_order` (first = 1, second = 2, etc.)',
  })
  @ApiParam({
    name: 'seller_id',
    type: Number,
    description: 'ID of the seller',
    example: 1,
  })
  @ApiBody({ type: UpdateMediaMappingDto })
  @ApiOkResponse({
    description: 'Media mapping updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not seller owner' })
  @ApiResponse({ status: 404, description: 'Media mapping not found' })
  @HttpCode(HttpStatus.OK)
  updateMediaMapping(
    @Param('seller_id', ParseIntPipe) sellerId: number,
    @Body() updateDto: UpdateMediaMappingDto,
    @CurrentUser() currentUser: User,
  ) {
    this.validateSellerOwnership(currentUser, sellerId);
    return this.mediaService.updateMediaMapping(sellerId, updateDto);
  }

  @Patch('link/sync-primary-image')
  @ApiOperation({
    summary: 'Sync primary image (replace existing primary only)',
    description:
      'Replace the primary image for a product. Unsets ALL existing primary mappings (if any) and sets the provided media_id as the single primary. Gallery images (is_primary=false) are not modified, except if the selected media currently exists as a gallery mapping it will be promoted to primary.',
  })
  @ApiParam({
    name: 'seller_id',
    type: Number,
    description: 'ID of the seller',
    example: 1,
  })
  @ApiBody({ type: SyncPrimaryImageDto })
  @ApiOkResponse({
    description: 'Primary image synced successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not seller owner' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  @HttpCode(HttpStatus.OK)
  syncPrimaryImage(
    @Param('seller_id', ParseIntPipe) sellerId: number,
    @Body() syncDto: SyncPrimaryImageDto,
    @CurrentUser() currentUser: User,
  ) {
    this.validateSellerOwnership(currentUser, sellerId);
    return this.mediaService.syncPrimaryImage(sellerId, syncDto);
  }

  @Patch('link/sync-product-images')
  @ApiOperation({
    summary: 'Sync product gallery images (replace gallery only)',
    description:
      'Replace all product gallery mappings (is_primary=false) for a product using the provided media_ids array. The existing primary mapping (is_primary=true) is retained and not modified.',
  })
  @ApiParam({
    name: 'seller_id',
    type: Number,
    description: 'ID of the seller',
    example: 1,
  })
  @ApiBody({ type: SyncProductImagesDto })
  @ApiOkResponse({
    description: 'Product images synced successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not seller owner' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  @HttpCode(HttpStatus.OK)
  syncProductImages(
    @Param('seller_id', ParseIntPipe) sellerId: number,
    @Body() syncDto: SyncProductImagesDto,
    @CurrentUser() currentUser: User,
  ) {
    this.validateSellerOwnership(currentUser, sellerId);
    return this.mediaService.syncProductImages(sellerId, syncDto);
  }

  @Patch(':id')
  @Permissions({ AC02: 'Edit' })
  @ApiOperation({
    summary: 'Update media metadata and/or replace file (seller owners only)',
    description:
      'Update media metadata (alt_text, description, status) and optionally replace the file. Only the seller who owns the media can update it.',
  })
  @ApiParam({
    name: 'seller_id',
    type: Number,
    description: 'ID of the seller',
    example: 1,
  })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
    description: 'ID of the media file to update',
    example: 123,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Update media metadata and optionally replace file',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          nullable: true,
          description: 'Optional: New file to replace the existing one',
        },
        title: {
          type: 'string',
          nullable: true,
          description: 'Media title',
          example: 'Product Image - Front View',
        },
        alt_text: {
          type: 'string',
          nullable: true,
          description: 'Alternative text for accessibility',
          example: 'Product front view',
        },
        description: {
          type: 'string',
          nullable: true,
          description: 'Media description',
          example: 'High quality product image showing details',
        },
        status: {
          type: 'string',
          enum: ['Active', 'Cancelled', 'Hold'],
          nullable: true,
          description: 'Media status (Active, Cancelled, or Hold)',
          example: 'Active',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiOkResponse({
    type: Media,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not media owner' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  update(
    @Param('seller_id', ParseIntPipe) sellerId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
    @UploadedFile() file?: Express.Multer.File,
    @Body('title') title?: string,
    @Body('alt_text') alt_text?: string,
    @Body('description') description?: string,
    @Body('status') status?: string,
  ) {
    this.validateSellerOwnership(currentUser, sellerId);

    const updateDto: UpdateMediaDto = {
      ...(title !== undefined && { title }),
      ...(alt_text !== undefined && { alt_text }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status: status as any }),
    };

    return this.mediaService.update(sellerId, id, updateDto, currentUser, file);
  }

  @Delete(':id')
  @Permissions({ AC02: 'Delete' })
  @ApiOperation({
    summary: 'Delete media (soft delete)',
    description:
      'Soft delete a media file. Only the seller who owns the media can delete it. The file remains in storage but is marked as deleted.',
  })
  @ApiParam({
    name: 'seller_id',
    type: Number,
    description: 'ID of the seller',
    example: 1,
  })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
    description: 'ID of the media file to delete',
    example: 123,
  })
  @ApiNoContentResponse({
    description: 'Media deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only delete your own media',
  })
  @ApiResponse({ status: 404, description: 'Media not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('seller_id', ParseIntPipe) sellerId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ) {
    this.validateSellerOwnership(currentUser, sellerId);
    return this.mediaService.remove(sellerId, id);
  }

  @Post('link')
  @Permissions({ AC02: 'Create' })
  @ApiOperation({
    summary: 'Link media to a product',
    description:
      'Link media files to a product. Supports 2 use cases:\n' +
      '1. **Primary image**: Set `is_primary: true` (only ONE per product, auto-replaces previous)\n' +
      '2. **Gallery images**: Set `is_primary: false` or omit (multiple allowed)\n\n' +
      '**Auto-primary**: If no primary image exists, the first gallery image will automatically become the primary.',
  })
  @ApiParam({
    name: 'seller_id',
    type: Number,
    description: 'ID of the seller',
    example: 1,
  })
  @ApiBody({ type: LinkMediaDto })
  @ApiCreatedResponse({
    description: 'Media linked to product successfully',
    schema: {
      type: 'object',
      properties: {
        linked_count: { type: 'number', example: 3 },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Media not found' })
  @HttpCode(HttpStatus.CREATED)
  linkToProduct(
    @Param('seller_id', ParseIntPipe) sellerId: number,
    @Body() linkDto: LinkMediaDto,
    @CurrentUser() currentUser: User,
  ) {
    this.validateSellerOwnership(currentUser, sellerId);
    return this.mediaService.linkToProduct(sellerId, linkDto);
  }

  @Delete('link/:id')
  @Permissions({ AC02: 'Delete' })
  @ApiOperation({
    summary: 'Unlink media from product',
    description:
      'Remove the association between a media file and a product. The media file itself is not deleted, only the link.',
  })
  @ApiParam({
    name: 'seller_id',
    type: Number,
    description: 'ID of the seller',
    example: 1,
  })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
    description: 'ID of the product media mapping to unlink',
    example: 123,
  })
  @ApiNoContentResponse({
    description: 'Media unlinked from product successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not seller owner' })
  @ApiResponse({
    status: 404,
    description: 'Product or media link not found',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  unlinkFromProduct(
    @Param('seller_id', ParseIntPipe) sellerId: number,
    @Param('id', ParseIntPipe) mappingId: number,
    @CurrentUser() currentUser: User,
  ) {
    this.validateSellerOwnership(currentUser, sellerId);
    return this.mediaService.unlinkFromProduct(sellerId, mappingId);
  }

  @Public()
  @Get('product/:productId')
  @ApiOperation({
    summary: 'Get all media for a specific product (Public)',
    description:
      'Retrieve all media files linked to a product, ordered by display_order. All media is public. Includes media metadata and URLs. Use is_primary query param to filter by primary status.',
  })
  @ApiParam({
    name: 'seller_id',
    type: Number,
    description: 'ID of the seller',
    example: 1,
  })
  @ApiParam({
    name: 'productId',
    type: Number,
    required: true,
    description: 'ID of the product',
    example: 50,
  })
  @ApiQuery({
    name: 'is_primary',
    type: Boolean,
    required: false,
    description:
      'Filter by primary status. Use "true" to get only primary image, "false" for gallery images only.',
    example: true,
  })
  @ApiOkResponse({
    description:
      'List of media files for the product with mapping info (is_primary, display_order)',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            example: 123,
            description: 'ID of the product media mapping row',
          },
          media: { $ref: '#/components/schemas/Media' },
          is_primary: {
            type: 'boolean',
            example: true,
            description: 'Whether this is the primary product image',
          },
          display_order: {
            type: 'number',
            example: 0,
            description: 'Display order (0 = first)',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  getMedia(
    @Param('seller_id', ParseIntPipe) sellerId: number,
    @Param('productId', ParseIntPipe) productId: number,
    @Query('is_primary') isPrimaryStr?: string,
  ) {
    const isPrimary =
      isPrimaryStr !== undefined ? isPrimaryStr === 'true' : undefined;

    return this.mediaService.getMedia(sellerId, productId, {
      isPrimary,
    });
  }

  @Post('reorder')
  @Permissions({ AC02: 'Edit' })
  @ApiOperation({
    summary: 'Reorder media for a product',
    description:
      'Update the display order of media files for a product. Useful for arranging product gallery images.',
  })
  @ApiParam({
    name: 'seller_id',
    type: Number,
    description: 'ID of the seller',
    example: 1,
  })
  @ApiBody({
    type: ReorderMediaDto,
    description: 'Reorder configuration with new display order for each media',
    examples: {
      reorder: {
        summary: 'Reorder 3 media files',
        value: {
          product_id: 50,
          media_order: [
            { media_id: 102, display_order: 0 },
            { media_id: 101, display_order: 1 },
            { media_id: 103, display_order: 2 },
          ],
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Media reordered successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not seller owner' })
  @ApiResponse({
    status: 404,
    description: 'Product or media not found',
  })
  @HttpCode(HttpStatus.OK)
  reorderMedia(
    @Param('seller_id', ParseIntPipe) sellerId: number,
    @Body() reorderDto: ReorderMediaDto,
    @CurrentUser() currentUser: User,
  ) {
    this.validateSellerOwnership(currentUser, sellerId);
    return this.mediaService.reorderMedia(reorderDto);
  }
}
