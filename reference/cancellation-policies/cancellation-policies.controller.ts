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
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { CancellationPoliciesService } from './cancellation-policies.service';
import { CancellationPolicy } from './domain/cancellation-policy';
import { CreateCancellationPolicyDto } from './dto/create-cancellation-policy.dto';
import { UpdateCancellationPolicyDto } from './dto/update-cancellation-policy.dto';
import { QueryCancellationPolicyDto } from './dto/query-cancellation-policy.dto';
import {
  PaginatedResponse,
  PaginatedResponseDto,
} from '@/utils/dto/paginated-response.dto';
import { paginate } from '@/utils/paginate';

@ApiTags('Cancellation Policies')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'cancellation-policies',
  version: '1',
})
export class CancellationPoliciesController {
  constructor(private readonly service: CancellationPoliciesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new cancellation policy' })
  @ApiCreatedResponse({
    type: CancellationPolicy,
    description: 'Cancellation policy created successfully',
  })
  create(
    @Body() dto: CreateCancellationPolicyDto,
  ): Promise<CancellationPolicy> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all cancellation policies with pagination' })
  @ApiOkResponse({
    type: PaginatedResponse(CancellationPolicy),
    description: 'List of cancellation policies',
  })
  async findAll(
    @Query() query: QueryCancellationPolicyDto,
  ): Promise<PaginatedResponseDto<CancellationPolicy>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);

    const result = await this.service.findAll(query);
    return paginate(result, { page, limit });
  }

  @Get('default')
  @ApiOperation({ summary: 'Get platform default cancellation policy' })
  @ApiOkResponse({
    type: CancellationPolicy,
    description: 'Default cancellation policy',
  })
  @ApiResponse({ status: 404, description: 'No default policy found' })
  async findDefault(): Promise<CancellationPolicy | null> {
    return this.service.findDefault();
  }

  @Get('sellers/:sellerId')
  @ApiOperation({ summary: 'Get cancellation policies for a seller' })
  @ApiParam({ name: 'sellerId', type: Number, description: 'Seller ID' })
  @ApiOkResponse({
    type: [CancellationPolicy],
    description: 'List of seller cancellation policies',
  })
  findBySellerId(
    @Param('sellerId', ParseIntPipe) sellerId: number,
  ): Promise<CancellationPolicy[]> {
    return this.service.findBySellerId(sellerId);
  }

  @Get('services/:serviceId')
  @ApiOperation({ summary: 'Get cancellation policy for a service' })
  @ApiParam({ name: 'serviceId', type: Number, description: 'Service ID' })
  @ApiOkResponse({
    type: CancellationPolicy,
    description: 'Service cancellation policy',
  })
  findByServiceId(
    @Param('serviceId', ParseIntPipe) serviceId: number,
  ): Promise<CancellationPolicy | null> {
    return this.service.findByServiceId(serviceId);
  }

  @Get('applicable')
  @ApiOperation({
    summary: 'Get applicable policy for a service/seller with fallback',
    description:
      'Returns the most specific applicable policy: service > seller > platform default',
  })
  @ApiOkResponse({
    type: CancellationPolicy,
    description: 'Applicable cancellation policy',
  })
  getApplicablePolicy(
    @Query('service_id') serviceId?: number,
    @Query('seller_id') sellerId?: number,
  ): Promise<CancellationPolicy | null> {
    return this.service.getApplicablePolicy(
      serviceId ? Number(serviceId) : undefined,
      sellerId ? Number(sellerId) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cancellation policy by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Policy ID' })
  @ApiOkResponse({
    type: CancellationPolicy,
    description: 'Cancellation policy details',
  })
  findById(@Param('id', ParseIntPipe) id: number): Promise<CancellationPolicy> {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update cancellation policy' })
  @ApiParam({ name: 'id', type: Number, description: 'Policy ID' })
  @ApiOkResponse({
    type: CancellationPolicy,
    description: 'Cancellation policy updated successfully',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCancellationPolicyDto,
  ): Promise<CancellationPolicy> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete cancellation policy',
    description: 'Soft deletes the policy by setting status to Inactive',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Policy ID' })
  @ApiNoContentResponse({ description: 'Cancellation policy deleted' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.remove(id);
  }
}
