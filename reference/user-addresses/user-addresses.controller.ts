import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
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
import { UserAddress } from '@/user-addresses/domain/user-address';
import { CreateUserAddressDto } from '@/user-addresses/dto/create-user-address.dto';
import { UpdateUserAddressDto } from '@/user-addresses/dto/update-user-address.dto';
import { UserAddressesService } from '@/user-addresses/user-addresses.service';
import { User } from '@/users/domain/user';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';

@ApiTags('User Addresses')
@ApiBearerAuth()
@ApiExtraModels(UserAddress, CreateUserAddressDto, UpdateUserAddressDto)
@UseGuards(JwtGuard)
@Controller({
  path: 'user-addresses',
  version: '1',
})
export class UserAddressesController {
  constructor(private readonly userAddressesService: UserAddressesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new address',
    description:
      'Creates a new shipping address for the current user. ' +
      'The first address created will automatically become the default. ' +
      'Maximum 10 addresses per user.',
  })
  @ApiBody({ type: CreateUserAddressDto })
  @ApiResponse({
    status: 201,
    description: 'Address successfully created',
    type: UserAddress,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  @ApiResponse({
    status: 422,
    description:
      'Unprocessable Entity - validation failed or max addresses reached (limit: 10)',
  })
  async create(
    @Body() createDto: CreateUserAddressDto,
    @CurrentUser() currentUser: User,
  ): Promise<UserAddress> {
    return await this.userAddressesService.create(createDto, currentUser);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "List current user's addresses",
    description:
      'Returns all addresses for the current user, ordered by is_default DESC, created_at DESC. ' +
      'Soft-deleted addresses are excluded.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of addresses (default address first)',
    type: [UserAddress],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  async findAll(@CurrentUser() currentUser: User): Promise<UserAddress[]> {
    return await this.userAddressesService.findAll(currentUser);
  }

  @Get('default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get the default address',
    description:
      'Returns the default shipping address for the current user. ' +
      'Returns null if no default address is set.',
  })
  @ApiResponse({
    status: 200,
    description: 'Default address or null if none set',
    type: UserAddress,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  async findDefault(
    @CurrentUser() currentUser: User,
  ): Promise<UserAddress | null> {
    return await this.userAddressesService.findDefault(currentUser);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get address by ID',
    description:
      'Returns a specific address by ID. Only returns addresses owned by the current user.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Address ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Address found',
    type: UserAddress,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  @ApiResponse({
    status: 404,
    description: 'Address not found or does not belong to current user',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<UserAddress> {
    return await this.userAddressesService.findOne(id, currentUser);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update address',
    description:
      'Partially updates an existing address. Only the owner can update their addresses. ' +
      'Setting is_default=true will unset the previous default address.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Address ID',
    example: 1,
  })
  @ApiBody({ type: UpdateUserAddressDto })
  @ApiResponse({
    status: 200,
    description: 'Address successfully updated',
    type: UserAddress,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  @ApiResponse({
    status: 404,
    description: 'Address not found or does not belong to current user',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateUserAddressDto,
    @CurrentUser() currentUser: User,
  ): Promise<UserAddress> {
    return await this.userAddressesService.update(id, updateDto, currentUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft delete address',
    description:
      'Soft deletes an address. If the deleted address was the default, ' +
      'another address will be promoted to default automatically.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Address ID',
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: 'Address successfully deleted',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  @ApiResponse({
    status: 404,
    description: 'Address not found or does not belong to current user',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return await this.userAddressesService.remove(id, currentUser);
  }

  @Patch(':id/set-default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set address as default',
    description:
      'Sets the specified address as the default shipping address. ' +
      'The previous default address will be unset automatically. ' +
      'Only one address can be default per user.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Address ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Address set as default',
    type: UserAddress,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  @ApiResponse({
    status: 404,
    description: 'Address not found or does not belong to current user',
  })
  async setAsDefault(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<UserAddress> {
    return await this.userAddressesService.setAsDefault(id, currentUser);
  }
}
