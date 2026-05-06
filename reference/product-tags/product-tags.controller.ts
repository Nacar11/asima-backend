import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ProductTagsService } from './product-tags.service';
import { AssignTagsDto } from '@/tags/dto/assign-tags.dto';
import { BulkAssignProductTagsDto } from './dto/bulk-assign-product-tags.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { ProductTag } from './domain/product-tag';

@ApiTags('Product Tags')
@Controller({
  path: 'products',
  version: '1',
})
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ProductTagsController {
  constructor(private readonly productTagsService: ProductTagsService) {}

  @Post(':id/tags')
  @ApiOperation({ summary: 'Assign tags to a product' })
  @ApiResponse({
    status: 200,
    description: 'Tags assigned successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Maximum 20 tags per product exceeded',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not product owner',
  })
  async assignTags(
    @Param('id', ParseIntPipe) productId: number,
    @Body() assignTagsDto: AssignTagsDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.productTagsService.assignTagsToProduct(
      productId,
      assignTagsDto,
      currentUser,
    );
  }

  @Delete(':id/tags/:tagId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a tag from a product' })
  @ApiResponse({
    status: 200,
    description: 'Tag removed successfully',
  })
  @ApiResponse({ status: 404, description: 'Tag assignment not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not product owner' })
  async removeTag(
    @Param('id', ParseIntPipe) productId: number,
    @Param('tagId', ParseIntPipe) tagId: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.productTagsService.removeTagFromProduct(
      productId,
      tagId,
      currentUser,
    );
  }

  @Get(':id/tags')
  @ApiOperation({ summary: 'Get all tags for a product' })
  @ApiResponse({
    status: 200,
    description: 'Product tags retrieved successfully',
    type: [ProductTag],
  })
  async getProductTags(@Param('id', ParseIntPipe) productId: number) {
    return this.productTagsService.getProductTags(productId);
  }

  @Post('bulk/assign-tags')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk assign tags to multiple products' })
  @ApiBody({ type: BulkAssignProductTagsDto })
  @ApiResponse({
    status: 200,
    description: 'Tags assigned to products',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not owner of some products',
  })
  async bulkAssignTags(
    @Body() bulkAssignDto: BulkAssignProductTagsDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.productTagsService.bulkAssignTags(
      bulkAssignDto.product_ids,
      bulkAssignDto.tag_ids,
      currentUser,
    );
  }

  @Post('bulk/unassign-tags')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk remove tags from multiple products' })
  @ApiBody({ type: BulkAssignProductTagsDto })
  @ApiResponse({
    status: 200,
    description: 'Tags removed from products',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not owner of some products',
  })
  async bulkUnassignTags(
    @Body() bulkUnassignDto: BulkAssignProductTagsDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.productTagsService.bulkUnassignTags(
      bulkUnassignDto.product_ids,
      bulkUnassignDto.tag_ids,
      currentUser,
    );
  }
}
