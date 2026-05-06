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
  NotFoundException,
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
import { ShippingService } from '@/shipping/services/shipping.service';
import { ShippingProvider } from '@/shipping/domain/shipping-provider';
import { ShippingZone } from '@/shipping/domain/shipping-zone';
import { ShippingMethod } from '@/shipping/domain/shipping-method';
import { ShippingDistanceTier } from '@/shipping/domain/shipping-distance-tier';
import { CreateShippingProviderDto } from '@/shipping/dto/create-shipping-provider.dto';
import { UpdateShippingProviderDto } from '@/shipping/dto/update-shipping-provider.dto';
import { CreateShippingZoneDto } from '@/shipping/dto/create-shipping-zone.dto';
import { UpdateShippingZoneDto } from '@/shipping/dto/update-shipping-zone.dto';
import { CreateShippingMethodDto } from '@/shipping/dto/create-shipping-method.dto';
import { UpdateShippingMethodDto } from '@/shipping/dto/update-shipping-method.dto';
import { CreateDistanceTierDto } from '@/shipping/dto/create-distance-tier.dto';
import { UpdateDistanceTierDto } from '@/shipping/dto/update-distance-tier.dto';
import {
  QueryShippingProviderDto,
  QueryShippingMethodDto,
} from '@/shipping/dto/query-shipping.dto';
import { ShippingZoneRepository } from '@/shipping/persistence/repositories/shipping-zone.repository';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Admin controller for managing shipping providers, methods, and tiers
 */
@ApiTags('Admin Shipping')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'admin/shipping',
  version: '1',
})
export class AdminShippingController {
  constructor(
    private readonly shippingService: ShippingService,
    private readonly zoneRepository: ShippingZoneRepository,
  ) {}

  // ==================== Providers ====================

  @Post('providers')
  @ApiOperation({
    summary: 'Create shipping provider',
    description: 'Creates a new shipping provider',
  })
  @ApiResponse({
    status: 201,
    description: 'Provider created successfully',
    type: ShippingProvider,
  })
  async createProvider(
    @Body() dto: CreateShippingProviderDto,
    @CurrentUser() user: User,
  ): Promise<ShippingProvider> {
    return this.shippingService.createProvider(dto, user);
  }

  @Get('providers')
  @ApiOperation({
    summary: 'List shipping providers',
    description: 'Retrieves all shipping providers with optional filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'List of providers',
  })
  async findAllProviders(
    @Query() query: QueryShippingProviderDto,
  ): Promise<{ data: ShippingProvider[]; totalCount: number }> {
    return this.shippingService.findAllProviders(query);
  }

  @Get('providers/:id')
  @ApiOperation({
    summary: 'Get shipping provider by ID',
    description: 'Retrieves a specific shipping provider',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Provider ID' })
  @ApiResponse({
    status: 200,
    description: 'Provider found',
    type: ShippingProvider,
  })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async findProviderById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ShippingProvider> {
    return this.shippingService.findProviderById(id);
  }

  @Patch('providers/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update shipping provider',
    description: 'Updates an existing shipping provider',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Provider ID' })
  @ApiResponse({
    status: 200,
    description: 'Provider updated successfully',
    type: ShippingProvider,
  })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async updateProvider(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShippingProviderDto,
    @CurrentUser() user: User,
  ): Promise<ShippingProvider> {
    return this.shippingService.updateProvider(id, dto, user);
  }

  @Delete('providers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete shipping provider',
    description: 'Soft deletes a shipping provider',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Provider ID' })
  @ApiResponse({ status: 204, description: 'Provider deleted successfully' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async removeProvider(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.shippingService.removeProvider(id, user);
  }

  // ==================== Zones ====================

  @Post('zones')
  @ApiOperation({
    summary: 'Create shipping zone',
    description: 'Creates a new shipping zone for a provider',
  })
  @ApiResponse({
    status: 201,
    description: 'Zone created successfully',
    type: ShippingZone,
  })
  async createZone(
    @Body() dto: CreateShippingZoneDto,
    @CurrentUser() user: User,
  ): Promise<ShippingZone> {
    // Clear default flag if creating a default zone
    if (dto.is_default) {
      await this.zoneRepository.clearDefaultFlag(dto.provider_id);
    }
    return this.zoneRepository.create(dto, { id: user.id } as UserEntity);
  }

  @Get('zones')
  @ApiOperation({
    summary: 'List shipping zones',
    description:
      'Retrieves all shipping zones, optionally filtered by provider',
  })
  @ApiQuery({
    name: 'provider_id',
    required: false,
    type: Number,
    description: 'Filter by provider ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of zones',
    type: [ShippingZone],
  })
  async findAllZones(
    @Query('provider_id') providerId?: number,
  ): Promise<ShippingZone[]> {
    return this.zoneRepository.findAll(providerId);
  }

  @Get('zones/:id')
  @ApiOperation({
    summary: 'Get shipping zone by ID',
    description: 'Retrieves a specific shipping zone with its areas',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Zone ID' })
  @ApiResponse({
    status: 200,
    description: 'Zone found',
    type: ShippingZone,
  })
  @ApiResponse({ status: 404, description: 'Zone not found' })
  async findZoneById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ShippingZone> {
    const zone = await this.zoneRepository.findById(id);
    if (!zone) {
      throw new NotFoundException('Zone not found');
    }
    return zone;
  }

  @Patch('zones/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update shipping zone',
    description: 'Updates an existing shipping zone',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Zone ID' })
  @ApiResponse({
    status: 200,
    description: 'Zone updated successfully',
    type: ShippingZone,
  })
  @ApiResponse({ status: 404, description: 'Zone not found' })
  async updateZone(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShippingZoneDto,
    @CurrentUser() user: User,
  ): Promise<ShippingZone> {
    const existingZone = await this.zoneRepository.findById(id);
    if (!existingZone) {
      throw new NotFoundException('Zone not found');
    }

    // Clear default flag if updating to default
    if (dto.is_default) {
      await this.zoneRepository.clearDefaultFlag(existingZone.provider_id, id);
    }

    const zone = await this.zoneRepository.update(id, dto, {
      id: user.id,
    } as UserEntity);
    if (!zone) {
      throw new NotFoundException('Zone not found');
    }
    return zone;
  }

  @Delete('zones/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete shipping zone',
    description: 'Soft deletes a shipping zone',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Zone ID' })
  @ApiResponse({ status: 204, description: 'Zone deleted successfully' })
  @ApiResponse({ status: 404, description: 'Zone not found' })
  async removeZone(@Param('id', ParseIntPipe) id: number): Promise<void> {
    const deleted = await this.zoneRepository.remove(id);
    if (!deleted) {
      throw new NotFoundException('Zone not found');
    }
  }

  // ==================== Methods ====================

  @Post('methods')
  @ApiOperation({
    summary: 'Create shipping method',
    description: 'Creates a new shipping method for a provider',
  })
  @ApiResponse({
    status: 201,
    description: 'Method created successfully',
    type: ShippingMethod,
  })
  async createMethod(
    @Body() dto: CreateShippingMethodDto,
    @CurrentUser() user: User,
  ): Promise<ShippingMethod> {
    return this.shippingService.createMethod(dto, user);
  }

  @Get('methods')
  @ApiOperation({
    summary: 'List shipping methods',
    description: 'Retrieves all shipping methods with optional filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'List of methods',
  })
  async findAllMethods(
    @Query() query: QueryShippingMethodDto,
  ): Promise<{ data: ShippingMethod[]; totalCount: number }> {
    return this.shippingService.findAllMethods(query);
  }

  @Get('methods/:id')
  @ApiOperation({
    summary: 'Get shipping method by ID',
    description: 'Retrieves a specific shipping method',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Method ID' })
  @ApiResponse({
    status: 200,
    description: 'Method found',
    type: ShippingMethod,
  })
  @ApiResponse({ status: 404, description: 'Method not found' })
  async findMethodById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ShippingMethod> {
    return this.shippingService.findMethodById(id);
  }

  @Patch('methods/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update shipping method',
    description: 'Updates an existing shipping method',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Method ID' })
  @ApiResponse({
    status: 200,
    description: 'Method updated successfully',
    type: ShippingMethod,
  })
  @ApiResponse({ status: 404, description: 'Method not found' })
  async updateMethod(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShippingMethodDto,
    @CurrentUser() user: User,
  ): Promise<ShippingMethod> {
    return this.shippingService.updateMethod(id, dto, user);
  }

  @Delete('methods/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete shipping method',
    description: 'Soft deletes a shipping method',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Method ID' })
  @ApiResponse({ status: 204, description: 'Method deleted successfully' })
  @ApiResponse({ status: 404, description: 'Method not found' })
  async removeMethod(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.shippingService.removeMethod(id, user);
  }

  // ==================== Distance Tiers ====================

  @Get('tiers')
  @ApiOperation({
    summary: 'List all distance tiers',
    description: 'Retrieves all distance tiers, optionally filtered by method',
  })
  @ApiQuery({
    name: 'method_id',
    required: false,
    type: Number,
    description: 'Filter by method ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of tiers',
    type: [ShippingDistanceTier],
  })
  async findAllTiers(
    @Query('method_id') methodId?: number,
  ): Promise<ShippingDistanceTier[]> {
    return this.shippingService.findAllTiers(methodId);
  }

  @Get('tiers/:id')
  @ApiOperation({
    summary: 'Get distance tier by ID',
    description: 'Retrieves a specific distance tier',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Tier ID' })
  @ApiResponse({
    status: 200,
    description: 'Tier found',
    type: ShippingDistanceTier,
  })
  @ApiResponse({ status: 404, description: 'Tier not found' })
  async findTierById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ShippingDistanceTier> {
    return this.shippingService.findTierById(id);
  }

  @Post('methods/:methodId/tiers')
  @ApiOperation({
    summary: 'Add distance tier to method',
    description: 'Creates a new distance tier for a shipping method',
  })
  @ApiParam({ name: 'methodId', type: Number, description: 'Method ID' })
  @ApiResponse({
    status: 201,
    description: 'Tier created successfully',
    type: ShippingDistanceTier,
  })
  async createTier(
    @Param('methodId', ParseIntPipe) methodId: number,
    @Body() dto: CreateDistanceTierDto,
  ): Promise<ShippingDistanceTier> {
    return this.shippingService.createTier(methodId, dto);
  }

  @Get('methods/:methodId/tiers')
  @ApiOperation({
    summary: 'List distance tiers for method',
    description: 'Retrieves all distance tiers for a shipping method',
  })
  @ApiParam({ name: 'methodId', type: Number, description: 'Method ID' })
  @ApiResponse({
    status: 200,
    description: 'List of tiers',
    type: [ShippingDistanceTier],
  })
  async findTiersByMethodId(
    @Param('methodId', ParseIntPipe) methodId: number,
  ): Promise<ShippingDistanceTier[]> {
    return this.shippingService.findTiersByMethodId(methodId);
  }

  @Patch('tiers/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update distance tier',
    description: 'Updates an existing distance tier',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Tier ID' })
  @ApiResponse({
    status: 200,
    description: 'Tier updated successfully',
    type: ShippingDistanceTier,
  })
  @ApiResponse({ status: 404, description: 'Tier not found' })
  async updateTier(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDistanceTierDto,
  ): Promise<ShippingDistanceTier> {
    return this.shippingService.updateTier(id, dto);
  }

  @Delete('tiers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete distance tier',
    description: 'Deletes a distance tier',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Tier ID' })
  @ApiResponse({ status: 204, description: 'Tier deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tier not found' })
  async removeTier(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.shippingService.removeTier(id);
  }
}
