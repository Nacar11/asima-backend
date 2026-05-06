import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Tag } from './domain/tag';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { DevExtremePaginatedResponse } from '@/devextreme/dto/paginated-response';
import { DevExtremeGetDto as GetQueryParams } from '@/devextreme/dto/devextreme-get.dto';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';
import { Permissions } from '@/user-permissions/persistence/user-permissions.decorator';

/**
 * Tags Controller
 * Handles seller-scoped tag operations
 * Route: /api/v1/sellers/:seller_id/tags
 *
 * Note: Tags are unique per seller, so there is no global /api/v1/tags endpoint
 * to avoid confusion with duplicate tag names across sellers.
 *
 * GET endpoints are public, while POST/PATCH/DELETE require authentication
 */
@ApiTags('Tags')
@Controller({
  path: 'sellers/:seller_id/tags',
  version: '1',
})
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  /**
   * Validates that the current user owns the seller or is a system admin
   */
  private validateSellerOwnership(currentUser: User, sellerId: number): void {
    // Uses seller_id from JWT payload
    if (!currentUser.system_admin && currentUser.seller_id !== sellerId) {
      throw new ForbiddenException(
        'You can only access tags for your own seller account',
      );
    }
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions({ SM03: 'Create' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new tag for seller' })
  @ApiParam({ name: 'seller_id', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Tag created successfully',
    type: Tag,
  })
  @ApiResponse({ status: 409, description: 'Tag name already exists' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not seller owner',
  })
  async create(
    @Param('seller_id', ParseIntPipe) sellerId: number,
    @Body() createTagDto: CreateTagDto,
    @CurrentUser() currentUser: User,
  ): Promise<Tag> {
    this.validateSellerOwnership(currentUser, sellerId);
    return this.tagsService.create(createTagDto, currentUser, sellerId);
  }

  @Get()
  @Permissions({ SM03: 'View' })
  @ApiOperation({
    summary:
      'Get all tags for seller with DevExtreme filtering and pagination (Public)',
    description: 'Public endpoint - no authentication required',
  })
  @ApiParam({ name: 'seller_id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Tags retrieved successfully',
    type: DevExtremePaginatedResponse(Tag),
  })
  async findBySeller(
    @Param('seller_id', ParseIntPipe) sellerId: number,
    @Query() query: GetQueryParams,
  ) {
    return this.tagsService.findBySeller(sellerId, query);
  }

  @Get(':slug')
  @Permissions({ SM03: 'View' })
  @ApiOperation({
    summary: 'Get a specific tag by slug for seller (Public)',
    description: 'Public endpoint - no authentication required',
  })
  @ApiParam({ name: 'seller_id', type: Number })
  @ApiParam({ name: 'slug', type: String, description: 'Tag slug' })
  @ApiResponse({
    status: 200,
    description: 'Tag retrieved successfully',
    type: Tag,
  })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async findOne(
    @Param('seller_id', ParseIntPipe) sellerId: number,
    @Param('slug') slug: string,
  ): Promise<Tag> {
    return this.tagsService.findOneBySlug(sellerId, slug);
  }

  @Patch(':slug')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions({ SM03: 'Edit' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a tag (seller owners only)' })
  @ApiParam({ name: 'seller_id', type: Number })
  @ApiParam({ name: 'slug', type: String, description: 'Tag slug' })
  @ApiResponse({
    status: 200,
    description: 'Tag updated successfully',
    type: Tag,
  })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  @ApiResponse({ status: 409, description: 'Tag name already exists' })
  @ApiResponse({ status: 403, description: 'Forbidden - not tag owner' })
  async update(
    @Param('seller_id', ParseIntPipe) sellerId: number,
    @Param('slug') slug: string,
    @Body() updateTagDto: UpdateTagDto,
    @CurrentUser() currentUser: User,
  ): Promise<Tag> {
    this.validateSellerOwnership(currentUser, sellerId);
    return this.tagsService.updateBySlug(
      sellerId,
      slug,
      updateTagDto,
      currentUser,
    );
  }

  @Delete(':slug')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions({ SM03: 'Delete' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a tag (seller owners only)' })
  @ApiParam({ name: 'seller_id', type: Number })
  @ApiParam({ name: 'slug', type: String, description: 'Tag slug' })
  @ApiResponse({
    status: 200,
    description: 'Tag deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not tag owner' })
  async remove(
    @Param('seller_id', ParseIntPipe) sellerId: number,
    @Param('slug') slug: string,
    @CurrentUser() currentUser: User,
  ) {
    this.validateSellerOwnership(currentUser, sellerId);
    return this.tagsService.removeBySlug(sellerId, slug, currentUser);
  }

  @Post('bulk/delete')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions({ SM03: 'Delete' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk delete multiple tags (seller owners only)' })
  @ApiParam({ name: 'seller_id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Tags deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not owner of some tags',
  })
  async bulkDelete(
    @Param('seller_id', ParseIntPipe) sellerId: number,
    @Body() body: { tag_ids: number[] },
    @CurrentUser() currentUser: User,
  ) {
    this.validateSellerOwnership(currentUser, sellerId);
    return this.tagsService.bulkDelete(body.tag_ids, currentUser);
  }
}
