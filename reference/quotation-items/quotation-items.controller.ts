import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
} from '@nestjs/swagger';
import { QuotationItemsService } from './quotation-items.service';
import { QuotationItem } from './domain/quotation-item';
import { AddQuotationItemsDto } from './dto/create-quotation-item.dto';
import { UpdateQuotationItemDto } from './dto/update-quotation-item.dto';
import { JwtGuard } from '@/utils/guards/jwt.guard';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

@ApiTags('Quotation Items')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller({
  path: 'quotation-items',
  version: '1',
})
export class QuotationItemsController {
  constructor(private readonly quotationItemsService: QuotationItemsService) {}

  @Post()
  @ApiOperation({
    summary: 'Add items to a quotation',
    description:
      'Seller adds service and/or material line items to a post-assessment quotation',
  })
  @ApiResponse({
    status: 201,
    description: 'Items added successfully',
    type: [QuotationItem],
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async addItems(
    @Body() input: AddQuotationItemsDto,
    @CurrentUser() user: User,
  ): Promise<QuotationItem[]> {
    return this.quotationItemsService.addItems(input, user);
  }

  @Get('booking/:bookingId')
  @ApiOperation({
    summary: 'Get quotation items by booking ID',
    description:
      'Returns all quotation line items with quotation status and quote_number for the booking. Use status to determine UI buttons (e.g., show "Revise Quotation" when status is "Revision Requested").',
  })
  @ApiResponse({
    status: 200,
    description:
      "Quotation items with status and quote number for the booking's quotation. When status is 'Revision Requested', customer_response contains the customer's revision notes.",
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'Quoted' },
        quote_number: { type: 'string', example: 'Q-2025-00123' },
        items: { type: 'array', items: { type: 'object' } },
        customer_response: {
          type: 'string',
          nullable: true,
          description:
            "Customer's revision request notes (when status is Revision Requested)",
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async findByBookingId(
    @Param('bookingId', ParseIntPipe) bookingId: number,
  ): Promise<{
    status: string;
    quote_number: string;
    items: QuotationItem[];
    customer_response?: string | null;
  }> {
    return this.quotationItemsService.findByBookingId(bookingId);
  }

  @Get('quotation/:quotationId')
  @ApiOperation({ summary: 'Get all items for a quotation' })
  @ApiResponse({
    status: 200,
    description: 'List of quotation items',
    type: [QuotationItem],
  })
  async findByQuotationId(
    @Param('quotationId', ParseIntPipe) quotationId: number,
  ): Promise<QuotationItem[]> {
    return this.quotationItemsService.findByQuotationId(quotationId);
  }

  @Get('quotation/:quotationId/summary')
  @ApiOperation({
    summary: 'Get quotation summary with totals',
    description: 'Returns items grouped by type with subtotals',
  })
  @ApiResponse({
    status: 200,
    description: 'Quotation summary',
  })
  async getQuotationSummary(
    @Param('quotationId', ParseIntPipe) quotationId: number,
  ): Promise<{
    service_items: QuotationItem[];
    material_items: QuotationItem[];
    services_total: number;
    materials_total: number;
    grand_total: number;
  }> {
    return this.quotationItemsService.getQuotationSummary(quotationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quotation item by ID' })
  @ApiResponse({
    status: 200,
    description: 'Quotation item details',
    type: QuotationItem,
  })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<QuotationItem> {
    return this.quotationItemsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a quotation item' })
  @ApiResponse({
    status: 200,
    description: 'Updated quotation item',
    type: QuotationItem,
  })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateQuotationItemDto,
    @CurrentUser() user: User,
  ): Promise<QuotationItem> {
    return this.quotationItemsService.update(id, input, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a quotation item' })
  @ApiResponse({ status: 204, description: 'Item deleted' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.quotationItemsService.delete(id, user);
  }
}
