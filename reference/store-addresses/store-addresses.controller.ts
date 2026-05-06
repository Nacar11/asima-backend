import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
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
  ApiBody,
  ApiExtraModels,
} from '@nestjs/swagger';
import { JwtGuard } from '@/utils/guards/jwt.guard';
import { StoreAddress } from '@/store-addresses/domain/store-address';
import { CreateStoreAddressDto } from '@/store-addresses/dto/create-store-address.dto';
import { UpdateStoreAddressDto } from '@/store-addresses/dto/update-store-address.dto';
import { QueryStoreAddressDto } from '@/store-addresses/dto/query-store-address.dto';
import { StoreAddressesService } from '@/store-addresses/store-addresses.service';
import { User } from '@/users/domain/user';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';

@ApiTags('Store Addresses')
@ApiBearerAuth()
@ApiExtraModels(StoreAddress, CreateStoreAddressDto, UpdateStoreAddressDto)
@UseGuards(JwtGuard)
@Controller({
  path: 'store-addresses',
  version: '1',
})
export class StoreAddressesController {
  constructor(private readonly storeAddressesService: StoreAddressesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a store address',
    description:
      'Creates a new physical store address for a seller. ' +
      'The first address created will automatically become the default.',
  })
  @ApiBody({ type: CreateStoreAddressDto })
  @ApiResponse({
    status: 201,
    description: 'Address created',
    type: StoreAddress,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async create(
    @Body() createDto: CreateStoreAddressDto,
    @CurrentUser() currentUser: User,
  ): Promise<StoreAddress> {
    return await this.storeAddressesService.create(createDto, currentUser);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List store addresses',
    description:
      'Returns store addresses filtered by seller_id, ordered by is_default DESC, created_at DESC.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of store addresses',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() query: QueryStoreAddressDto,
  ): Promise<{ data: StoreAddress[]; total: number }> {
    return await this.storeAddressesService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get store address by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Address found',
    type: StoreAddress,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<StoreAddress> {
    return await this.storeAddressesService.findOne(id, currentUser);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update store address',
    description:
      'Partially updates a store address. Setting is_default=true will unset the previous default.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateStoreAddressDto })
  @ApiResponse({
    status: 200,
    description: 'Address updated',
    type: StoreAddress,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateStoreAddressDto,
    @CurrentUser() currentUser: User,
  ): Promise<StoreAddress> {
    return await this.storeAddressesService.update(id, updateDto, currentUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete store address',
    description:
      'Soft deletes a store address. If it was the default, another address is promoted.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 204, description: 'Address deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return await this.storeAddressesService.remove(id, currentUser);
  }

  @Patch(':id/set-default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set store address as default',
    description:
      'Sets the specified address as the default store address. ' +
      'Only one address can be default per seller.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Address set as default',
    type: StoreAddress,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async setAsDefault(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<StoreAddress> {
    return await this.storeAddressesService.setAsDefault(id, currentUser);
  }
}
