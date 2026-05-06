import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiProduces,
} from '@nestjs/swagger';
import { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { Public } from '@/utils/decorators/public.decorator';
import { JwtGuard } from '@/utils/guards/jwt.guard';
import { User } from '@/users/domain/user';
import { Invoice } from './domain/invoice';
import { FindAllInvoice } from './domain/find-all-invoice';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { GenerateInvoiceResponseDto } from './dto/generate-invoice-response.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';

/**
 * Invoices Controller
 * Provides endpoints for invoice generation and management
 */
@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(ThrottlerGuard, JwtGuard)
@Controller({
  path: 'invoices',
  version: '1',
})
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  /**
   * Generate invoice for a completed order
   * Rate limited to 5 requests per minute per user
   */
  @Post('generate')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Generate invoice',
    description:
      'Generates an invoice for a completed order. ' +
      'Only the order owner or super admin can generate invoices.',
  })
  @ApiResponse({
    status: 201,
    description: 'Invoice generated successfully',
    type: GenerateInvoiceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invoice can only be generated for completed orders',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Invoice already exists for this order',
  })
  async generateInvoice(
    @Body() input: GenerateInvoiceDto,
    @CurrentUser() currentUser: User,
  ): Promise<GenerateInvoiceResponseDto> {
    const invoice = await this.invoicesService.generateInvoice(
      input,
      currentUser,
    );
    return {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      pdf_url: `/api/v1/invoices/${invoice.id}/download`,
    };
  }

  /**
   * List customer's invoices with pagination and filters
   */
  @Get()
  @ApiOperation({
    summary: 'List invoices',
    description: 'Returns paginated list of customer invoices with filters',
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
    description: 'Sort order',
  })
  @ApiQuery({
    name: 'start_date',
    required: false,
    type: String,
    description: 'Filter by start date',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    type: String,
    description: 'Filter by end date',
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
    description: 'Search by invoice or order number',
  })
  @ApiResponse({
    status: 200,
    description: 'List of invoices',
    type: FindAllInvoice,
  })
  async findAll(
    @Query() query: QueryInvoiceDto,
    @CurrentUser() currentUser: User,
  ): Promise<FindAllInvoice> {
    return this.invoicesService.findAll(query, currentUser);
  }

  /**
   * Get invoice by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get invoice by ID',
    description: 'Returns invoice details by ID',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Invoice ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice details',
    type: Invoice,
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<Invoice> {
    return this.invoicesService.findById(id, currentUser);
  }

  /**
   * Get invoice by order ID
   */
  @Get('order/:orderId')
  @ApiOperation({
    summary: 'Get invoice by order ID',
    description: 'Returns invoice details by order ID',
  })
  @ApiParam({
    name: 'orderId',
    type: Number,
    description: 'Order ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice details',
    type: Invoice,
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found for this order',
  })
  async findByOrderId(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser() currentUser: User,
  ): Promise<Invoice> {
    return this.invoicesService.findByOrderId(orderId, currentUser);
  }

  /**
   * Download invoice PDF
   */
  @Get(':id/download')
  @ApiOperation({
    summary: 'Download invoice PDF',
    description: 'Downloads the invoice as a PDF file',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Invoice ID',
  })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'Invoice PDF file',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  async downloadPdf(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
    @Res() res: Response,
  ): Promise<void> {
    const invoice = await this.invoicesService.findById(id, currentUser);
    const pdfBuffer = await this.invoicesService.generatePdf(id, currentUser);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Invoice-${invoice.invoice_number}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Public()
  @Get(':id/download-signed')
  @ApiOperation({
    summary: 'Download invoice PDF (signed link)',
    description:
      'Downloads invoice as PDF using a signed token (for email links).',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Invoice ID',
  })
  @ApiQuery({
    name: 'token',
    required: true,
    type: String,
    description: 'Signed download token',
  })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'Invoice PDF file',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async downloadPdfSigned(
    @Param('id', ParseIntPipe) id: number,
    @Query('token') token: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!token) {
      throw new BadRequestException('Missing token');
    }
    const { pdfBuffer, invoiceNumber } =
      await this.invoicesService.generatePdfSigned(id, token);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Invoice-${invoiceNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  /**
   * Resend invoice email
   * Rate limited to 5 requests per minute per user
   */
  @Post(':id/resend-email')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Resend invoice email',
    description: 'Resends the invoice email to the customer',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Invoice ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Email sent successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  async resendEmail(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<{ success: boolean; message: string }> {
    await this.invoicesService.resendEmail(id, currentUser);
    return { success: true, message: 'Email sent successfully' };
  }
}
