import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AttributesService } from './attributes.service';
import { Attribute } from './domain/attribute';
import { FindAllAttribute } from './domain/find-all-attribute';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { QueryAttributeDto } from './dto/query-attribute.dto';
import { BulkDeleteAttributesDto } from './dto/bulk-delete-attributes.dto';
import { User } from '@/users/domain/user';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';
import { Permissions } from '@/user-permissions/persistence/user-permissions.decorator';

@ApiTags('Attributes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({
  path: 'attributes',
  version: '1',
})
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Post()
  @Permissions({ SM04: 'Create' })
  @ApiOperation({ summary: 'Create a new attribute' })
  @ApiResponse({
    status: 201,
    description: 'Attribute created successfully',
    type: Attribute,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() createAttributeDto: CreateAttributeDto,
    @CurrentUser() currentUser: User,
  ): Promise<Attribute> {
    return this.attributesService.create(createAttributeDto, currentUser);
  }

  @Get()
  @Permissions({ SM04: 'View' })
  @ApiOperation({ summary: 'Get all attributes with pagination and filtering' })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Filter by attribute name',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    enum: ['ASC', 'DESC'],
    description: 'Sort by created_at (ASC or DESC, default: DESC)',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    example: 0,
    description: 'Number of items to skip (default: 0)',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    example: 20,
    description: 'Number of items to take/return (default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Attributes retrieved successfully',
    type: FindAllAttribute,
  })
  findAll(
    @Query() query: QueryAttributeDto,
    @CurrentUser() currentUser: User,
  ): Promise<FindAllAttribute> {
    return this.attributesService.findAll(query, currentUser);
  }

  @Get(':id')
  @Permissions({ SM04: 'View' })
  @ApiOperation({ summary: 'Get attribute by ID' })
  @ApiResponse({
    status: 200,
    description: 'Attribute retrieved successfully',
    type: Attribute,
  })
  @ApiResponse({ status: 404, description: 'Attribute not found' })
  findById(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ): Promise<Attribute> {
    return this.attributesService.findById(+id, currentUser);
  }

  @Put(':id')
  @Permissions({ SM04: 'Edit' })
  @ApiOperation({ summary: 'Update attribute by ID' })
  @ApiResponse({
    status: 200,
    description: 'Attribute updated successfully',
    type: Attribute,
  })
  @ApiResponse({ status: 404, description: 'Attribute not found' })
  update(
    @Param('id') id: string,
    @Body() updateAttributeDto: UpdateAttributeDto,
    @CurrentUser() currentUser: User,
  ): Promise<Attribute> {
    return this.attributesService.update(+id, updateAttributeDto, currentUser);
  }

  @Post('bulk-delete')
  @Permissions({ SM04: 'Delete' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk delete attributes',
    description:
      'Deletes multiple attributes. Skips attributes used by products.',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk delete result',
  })
  bulkDelete(
    @Body() body: BulkDeleteAttributesDto,
    @CurrentUser() currentUser: User,
  ): Promise<{
    message: string;
    deleted_count: number;
    failed: { id: number; reason: string }[];
  }> {
    return this.attributesService.bulkDelete(body.ids, currentUser);
  }

  @Delete(':id')
  @Permissions({ SM04: 'Delete' })
  @ApiOperation({ summary: 'Delete attribute by ID' })
  @ApiResponse({ status: 200, description: 'Attribute deleted successfully' })
  @ApiResponse({ status: 404, description: 'Attribute not found' })
  delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return this.attributesService.delete(+id, currentUser);
  }
}
