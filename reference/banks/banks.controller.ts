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
import { BanksService } from '@/banks/banks.service';
import { Bank } from '@/banks/domain/bank';
import { FindAllBank } from '@/banks/domain/find-all-bank';
import { CreateBankDto } from '@/banks/dto/create-bank.dto';
import { UpdateBankDto } from '@/banks/dto/update-bank.dto';
import { QueryBankDto } from '@/banks/dto/query-bank.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

/**
 * Controller for bank endpoints (master data CRUD)
 */
@ApiTags('Banks')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'banks',
  version: '1',
})
export class BanksController {
  constructor(private readonly service: BanksService) {}

  /**
   * Create a new bank
   */
  @Post()
  @ApiOperation({
    summary: 'Create a new bank',
    description: 'Creates a new bank entry in the master data',
  })
  @ApiResponse({
    status: 201,
    description: 'Bank created successfully',
    type: Bank,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - bank code already exists',
  })
  create(
    @Body() input: CreateBankDto,
    @CurrentUser() currentUser: User,
  ): Promise<Bank> {
    return this.service.create(input, currentUser);
  }

  /**
   * Get all banks with pagination and filters
   */
  @Get()
  @ApiOperation({
    summary: 'Get all banks',
    description: 'Retrieves banks with optional filters and pagination',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by bank code or bank name',
  })
  @ApiQuery({
    name: 'bank_code',
    required: false,
    type: String,
    description: 'Filter by exact bank code',
  })
  @ApiQuery({
    name: 'is_active',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    enum: ['ASC', 'DESC'],
    description: 'Sort by display_order (ASC or DESC, default: ASC)',
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
    description: 'List of banks',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array' },
        totalCount: { type: 'number' },
        skip: { type: 'number' },
        take: { type: 'number' },
      },
    },
  })
  findAll(@Query() query: QueryBankDto): Promise<FindAllBank> {
    return this.service.findAll(query);
  }

  /**
   * Get active banks for dropdowns
   */
  @Get('active')
  @ApiOperation({
    summary: 'Get active banks',
    description:
      'Retrieves all active banks sorted by display order (for dropdowns)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active banks',
    type: [Bank],
  })
  findActiveBanks(): Promise<Bank[]> {
    return this.service.findActiveBanks();
  }

  /**
   * Get bank by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get bank by ID',
    description: 'Retrieves a specific bank by ID',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Bank ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Bank found',
    type: Bank,
  })
  @ApiResponse({
    status: 404,
    description: 'Bank not found',
  })
  findById(@Param('id', ParseIntPipe) id: number): Promise<Bank> {
    return this.service.findById(id);
  }

  /**
   * Update a bank
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a bank',
    description: 'Updates an existing bank entry',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Bank ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Bank updated successfully',
    type: Bank,
  })
  @ApiResponse({
    status: 404,
    description: 'Bank not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - bank code already exists',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateBankDto,
    @CurrentUser() currentUser: User,
  ): Promise<Bank> {
    return this.service.update(id, input, currentUser);
  }

  /**
   * Delete a bank (soft delete)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a bank',
    description: 'Soft deletes a bank entry',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Bank ID',
  })
  @ApiResponse({
    status: 204,
    description: 'Bank deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Bank not found',
  })
  delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.remove(id);
  }
}
