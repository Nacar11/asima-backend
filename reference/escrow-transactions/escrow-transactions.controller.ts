import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { EscrowTransactionsService } from './escrow-transactions.service';
import { CreateEscrowTransactionDto } from './dto/create-escrow-transaction.dto';
import { UpdateEscrowTransactionDto } from './dto/update-escrow-transaction.dto';
import { QueryEscrowTransactionDto } from './dto/query-escrow-transaction.dto';
import { ReleaseEscrowDto } from './dto/release-escrow.dto';
import { EscrowTransaction } from './domain/escrow-transaction';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

@ApiTags('Escrow Transactions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'escrow-transactions',
  version: '1',
})
export class EscrowTransactionsController {
  constructor(private readonly service: EscrowTransactionsService) {}

  @Post()
  @ApiCreatedResponse({
    type: EscrowTransaction,
    description: 'Escrow transaction created successfully',
  })
  create(@Body() dto: CreateEscrowTransactionDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get()
  @ApiOkResponse({
    type: EscrowTransaction,
    isArray: true,
    description: 'List of escrow transactions',
  })
  findAll(
    @Query() query: QueryEscrowTransactionDto,
    @CurrentUser() user: User,
  ) {
    return this.service.findAll(query, user);
  }

  @Get('booking/:bookingId')
  @ApiParam({ name: 'bookingId', type: Number })
  @ApiOkResponse({
    type: EscrowTransaction,
    isArray: true,
    description: 'Escrow transactions for a booking',
  })
  findByBookingId(
    @Param('bookingId') bookingId: number,
    @CurrentUser() user: User,
  ) {
    return this.service.findByBookingId(bookingId, user);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    type: EscrowTransaction,
    description: 'Escrow transaction details',
  })
  findById(@Param('id') id: number, @CurrentUser() user: User) {
    return this.service.findById(id, user);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    type: EscrowTransaction,
    description: 'Escrow transaction updated successfully',
  })
  update(
    @Param('id') id: number,
    @Body() dto: UpdateEscrowTransactionDto,
    @CurrentUser() user: User,
  ) {
    return this.service.update(id, dto, user);
  }

  @Post('release')
  @HttpCode(HttpStatus.OK)
  @ApiCreatedResponse({
    type: EscrowTransaction,
    description: 'Escrow funds released successfully',
  })
  releaseToProvider(@Body() dto: ReleaseEscrowDto, @CurrentUser() user: User) {
    return this.service.releaseToProvider(dto.milestone_id, dto, user);
  }

  @Post('refund')
  @HttpCode(HttpStatus.OK)
  @ApiCreatedResponse({
    type: EscrowTransaction,
    description: 'Refund transaction created successfully',
  })
  processRefund(
    @Body()
    body: {
      booking_id: number;
      amount: number;
      currency_id: number;
      notes?: string;
    },
    @CurrentUser() user: User,
  ) {
    return this.service.processRefund(
      body.booking_id,
      body.amount,
      body.currency_id,
      body.notes || '',
      user,
    );
  }

  @Post('dispute/hold')
  @HttpCode(HttpStatus.OK)
  @ApiCreatedResponse({
    type: EscrowTransaction,
    description: 'Dispute hold created successfully',
  })
  holdForDispute(
    @Body()
    body: {
      booking_id: number;
      amount: number;
      currency_id: number;
      notes?: string;
    },
    @CurrentUser() user: User,
  ) {
    return this.service.holdForDispute(
      body.booking_id,
      body.amount,
      body.currency_id,
      body.notes || '',
      user,
    );
  }

  @Post('dispute/release')
  @HttpCode(HttpStatus.OK)
  @ApiCreatedResponse({
    type: EscrowTransaction,
    description: 'Dispute release created successfully',
  })
  releaseFromDispute(
    @Body()
    body: {
      booking_id: number;
      amount: number;
      currency_id: number;
      released_to: number;
      notes?: string;
    },
    @CurrentUser() user: User,
  ) {
    return this.service.releaseFromDispute(
      body.booking_id,
      body.amount,
      body.currency_id,
      body.released_to,
      body.notes || '',
      user,
    );
  }
}
