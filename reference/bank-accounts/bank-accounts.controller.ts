import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BankAccountsService } from './bank-accounts.service';
import { BankAccount } from './domain/bank-account';
import { FindAllBankAccount } from './domain/find-all-bank-account';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { QueryBankAccountDto } from './dto/query-bank-account.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

@ApiTags('Bank Accounts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'bank-accounts',
  version: '1',
})
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add new bank account',
    description: 'Add a new bank account for the authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bank account created successfully',
    type: BankAccount,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Bank account already exists',
  })
  async create(
    @Body() input: CreateBankAccountDto,
    @CurrentUser() currentUser: User,
  ): Promise<BankAccount> {
    return this.bankAccountsService.create(input, currentUser);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List bank accounts',
    description: 'Get all bank accounts for the authenticated user',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Number of records to skip',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'Number of records to take',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort direction',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'verified', 'unverified'],
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'is_default',
    required: false,
    type: Boolean,
    description: 'Filter by default status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by bank name or account holder name',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of bank accounts',
    type: FindAllBankAccount,
  })
  async findAll(
    @Query() query: QueryBankAccountDto,
    @CurrentUser() currentUser: User,
  ): Promise<FindAllBankAccount> {
    return this.bankAccountsService.findAll(query, currentUser);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get bank account details',
    description: 'Get details of a specific bank account',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Bank account ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bank account details',
    type: BankAccount,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bank account not found',
  })
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<BankAccount> {
    return this.bankAccountsService.findById(id, currentUser);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update bank account',
    description: 'Update details of a specific bank account',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Bank account ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bank account updated successfully',
    type: BankAccount,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bank account not found',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateBankAccountDto,
    @CurrentUser() currentUser: User,
  ): Promise<BankAccount> {
    return this.bankAccountsService.update(id, input, currentUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete bank account',
    description: 'Soft delete a bank account',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Bank account ID',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Bank account deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bank account not found',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return this.bankAccountsService.remove(id, currentUser);
  }
}
