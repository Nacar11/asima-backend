import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SellerCertificationsService } from '@/seller-certifications/seller-certifications.service';
import { SellerCertification } from '@/seller-certifications/domain/seller-certification';
import { CreateSellerCertificationDto } from '@/seller-certifications/dto/create-seller-certification.dto';
import { UpdateSellerCertificationDto } from '@/seller-certifications/dto/update-seller-certification.dto';
import { QuerySellerCertificationDto } from '@/seller-certifications/dto/query-seller-certification.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

@ApiTags('Seller Certifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'seller-certifications',
  version: '1',
})
export class SellerCertificationsController {
  constructor(private readonly service: SellerCertificationsService) {}

  /**
   * Create a new certification
   */
  @Post()
  @ApiOperation({
    summary: 'Add a certification',
    description: 'Creates a new certification for a seller',
  })
  @ApiResponse({
    status: 201,
    description: 'Certification created successfully',
    type: SellerCertification,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'Seller not found',
  })
  async create(
    @Body() dto: CreateSellerCertificationDto,
    @CurrentUser() currentUser: User,
  ): Promise<SellerCertification> {
    return this.service.create(dto, currentUser);
  }

  /**
   * Get all certifications
   */
  @Get()
  @ApiOperation({
    summary: 'Get all certifications',
    description:
      'Retrieves all certifications with optional filtering and pagination',
  })
  @ApiQuery({
    name: 'seller_id',
    required: false,
    type: Number,
    description: 'Filter by seller ID',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name or issuer',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['Active', 'Expired', 'Revoked'],
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Number of items to skip',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'Number of items to take',
  })
  @ApiResponse({
    status: 200,
    description: 'List of certifications',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array' },
        totalCount: { type: 'number' },
      },
    },
  })
  async findAll(@Query() query: QuerySellerCertificationDto): Promise<{
    data: SellerCertification[];
    totalCount: number;
  }> {
    return this.service.findAll(query);
  }

  /**
   * Get certification by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get certification by ID',
    description: 'Retrieves a specific certification by its ID',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Certification ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Certification found',
    type: SellerCertification,
  })
  @ApiResponse({
    status: 404,
    description: 'Certification not found',
  })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SellerCertification> {
    return this.service.findById(id);
  }

  /**
   * Update a certification
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a certification',
    description: 'Updates an existing certification',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Certification ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Certification updated successfully',
    type: SellerCertification,
  })
  @ApiResponse({
    status: 404,
    description: 'Certification not found',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSellerCertificationDto,
    @CurrentUser() currentUser: User,
  ): Promise<SellerCertification> {
    return this.service.update(id, dto, currentUser);
  }

  /**
   * Delete a certification
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a certification',
    description: 'Soft deletes a certification',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Certification ID',
  })
  @ApiResponse({
    status: 204,
    description: 'Certification deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Certification not found',
  })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return this.service.remove(id, currentUser);
  }
}
