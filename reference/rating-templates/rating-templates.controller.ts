import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RatingTemplatesService } from './rating-templates.service';
import { RatingTemplate } from './domain/rating-template';
import { CreateRatingTemplateDto } from './dto/create-rating-template.dto';
import { UpdateRatingTemplateDto } from './dto/update-rating-template.dto';
import { QueryRatingTemplateDto } from './dto/query-rating-template.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { IPaginatedResult } from '@/utils/types/paginated-result';

/**
 * Rating Templates Controller.
 *
 * Admin endpoints for managing rating criteria templates.
 *
 * @version 1
 * @since 1.0.0
 */
@ApiTags('Rating Templates')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'rating-templates',
  version: '1',
})
export class RatingTemplatesController {
  constructor(
    private readonly ratingTemplatesService: RatingTemplatesService,
  ) {}

  /**
   * POST /rating-templates
   * Create a new rating template (Admin)
   */
  @Post()
  @ApiOperation({
    summary: 'Create rating template',
    description: 'Admin creates a new rating criteria template',
  })
  @ApiResponse({
    status: 201,
    description: 'Template created successfully',
    type: RatingTemplate,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Code already exists' })
  async create(
    @Body() input: CreateRatingTemplateDto,
    @CurrentUser() user: User,
  ): Promise<RatingTemplate> {
    return this.ratingTemplatesService.create(input, user);
  }

  /**
   * GET /rating-templates
   * List all rating templates with pagination
   */
  @Get()
  @ApiOperation({
    summary: 'List rating templates',
    description: 'Get all rating templates with optional filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'List of rating templates',
  })
  async findAll(
    @Query() query: QueryRatingTemplateDto,
  ): Promise<IPaginatedResult<RatingTemplate>> {
    return this.ratingTemplatesService.findAll(query);
  }

  /**
   * GET /rating-templates/active
   * Get all active rating templates
   */
  @Get('active')
  @ApiOperation({
    summary: 'Get active rating templates',
    description: 'Get all active rating templates for display in forms',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active rating templates',
    type: [RatingTemplate],
  })
  async findAllActive(): Promise<RatingTemplate[]> {
    return this.ratingTemplatesService.findAllActive();
  }

  /**
   * GET /rating-templates/:id
   * Get a rating template by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get rating template by ID' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Rating template details',
    type: RatingTemplate,
  })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RatingTemplate> {
    return this.ratingTemplatesService.findById(id);
  }

  /**
   * PATCH /rating-templates/:id
   * Update a rating template (Admin)
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update rating template',
    description: 'Admin updates a rating criteria template',
  })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Template updated successfully',
    type: RatingTemplate,
  })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Code already exists' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateRatingTemplateDto,
    @CurrentUser() user: User,
  ): Promise<RatingTemplate> {
    return this.ratingTemplatesService.update(id, input, user);
  }

  /**
   * DELETE /rating-templates/:id
   * Soft delete a rating template (Admin)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete rating template',
    description: 'Admin soft deletes a rating criteria template',
  })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ status: 204, description: 'Template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.ratingTemplatesService.remove(id, user);
  }
}
