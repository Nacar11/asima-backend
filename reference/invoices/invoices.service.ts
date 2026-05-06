import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PDFDocument from 'pdfkit';
import { JwtService } from '@nestjs/jwt';
import { BaseInvoiceRepository } from './persistence/repositories/base-invoice.repository';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import {
  Invoice,
  InvoiceStatusEnum,
  InvoiceEmailStatusEnum,
} from './domain/invoice';
import { FindAllInvoice } from './domain/find-all-invoice';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { User } from '@/users/domain/user';
import { OrderStatusEnum } from '@/sales-orders/domain/order-status.enum';
import { MailerService } from '@/mailer/mailer.service';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@/config/config.type';
import path from 'path';
import fs from 'fs';

type SignedInvoicePdfResult = {
  pdfBuffer: Buffer;
  invoiceNumber: string;
};

/**
 * Invoice service for generating and managing invoices
 */
@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly invoiceRepository: BaseInvoiceRepository,
    @InjectRepository(SalesOrderEntity)
    private readonly salesOrderRepository: Repository<SalesOrderEntity>,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Generate invoice for a completed order
   * Uses database transaction to ensure atomicity
   */
  async generateInvoice(
    input: GenerateInvoiceDto,
    currentUser: User,
  ): Promise<Invoice> {
    const existingInvoice = await this.invoiceRepository.findByOrderId(
      input.order_id,
    );
    if (existingInvoice) {
      throw new ConflictException(
        'Invoice already exists for this order. Use the download endpoint instead.',
      );
    }
    const order = await this.salesOrderRepository.findOne({
      where: { id: input.order_id },
      relations: [
        'user',
        'seller',
        'items',
        'items.variant',
        'items.variant.product',
      ],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== OrderStatusEnum.COMPLETED) {
      throw new BadRequestException(
        'Invoice can only be generated for completed orders',
      );
    }
    if (order.user_id !== currentUser.id && currentUser.system_admin !== true) {
      throw new BadRequestException(
        'You can only generate invoices for your own orders',
      );
    }
    const dataSource = this.invoiceRepository.getDataSource();
    const invoice = await dataSource.transaction(async () => {
      const invoiceNumber =
        await this.invoiceRepository.generateInvoiceNumber();
      const customerName = this.formatCustomerName(order.user);
      const invoiceData: Partial<Invoice> = {
        invoice_number: invoiceNumber,
        order_id: order.id,
        seller_id: order.seller_id ?? 0,
        user_id: order.user_id,
        subtotal: Number(order.subtotal),
        tax_amount: Number(order.tax_amount),
        shipping_amount: Number(order.shipping_amount),
        total_amount: Number(order.total_amount),
        seller_store_name: this.sanitizeForPdf(
          order.seller?.store_name || 'N/A',
        ) as string,
        seller_business_registration:
          order.seller?.business_registration_number || null,
        seller_tax_id: order.seller?.tax_id || null,
        customer_name: this.sanitizeForPdf(customerName) as string,
        customer_email: order.user?.email || '',
        customer_phone: undefined,
        shipping_recipient_name: this.sanitizeForPdf(
          order.shipping_recipient_name,
        ),
        shipping_address_line1: this.sanitizeForPdf(
          order.shipping_address_line1,
        ),
        shipping_address_line2: this.sanitizeForPdf(
          order.shipping_address_line2,
        ),
        shipping_city: this.sanitizeForPdf(order.shipping_city),
        shipping_state_province: this.sanitizeForPdf(
          order.shipping_state_province,
        ),
        shipping_postal_code: this.sanitizeForPdf(order.shipping_postal_code),
        shipping_country: this.sanitizeForPdf(order.shipping_country),
        status: InvoiceStatusEnum.VALID,
        email_status: InvoiceEmailStatusEnum.PENDING,
        email_retry_count: 0,
        created_by: currentUser.id,
        updated_by: currentUser.id,
      };
      return this.invoiceRepository.create(invoiceData);
    });
    this.sendInvoiceEmail(invoice, order).catch((err) => {
      this.logger.error(
        `Failed to send invoice email for invoice ${invoice.id}`,
        err,
      );
    });
    return invoice;
  }

  /**
   * Get invoice by ID
   */
  async findById(id: number, currentUser: User): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    if (
      invoice.user_id !== currentUser.id &&
      currentUser.system_admin !== true
    ) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }

  /**
   * Get invoice by order ID
   */
  async findByOrderId(orderId: number, currentUser: User): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findByOrderId(orderId);
    if (!invoice) {
      throw new NotFoundException('Invoice not found for this order');
    }
    if (
      invoice.user_id !== currentUser.id &&
      currentUser.system_admin !== true
    ) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }

  /**
   * List customer's invoices with pagination and filters
   * Non-admin users can only see their own invoices
   */
  async findAll(
    query: QueryInvoiceDto,
    currentUser: User,
  ): Promise<FindAllInvoice> {
    const effectiveQuery = { ...query };
    if (currentUser.system_admin !== true) {
      effectiveQuery.user_id = currentUser.id;
    }
    return this.invoiceRepository.findAll(effectiveQuery);
  }

  /**
   * Generate PDF buffer for invoice
   */
  async generatePdf(invoiceId: number, currentUser: User): Promise<Buffer> {
    const invoice = await this.findById(invoiceId, currentUser);
    const order = await this.salesOrderRepository.findOne({
      where: { id: invoice.order_id },
      relations: ['seller', 'items', 'items.variant', 'items.variant.product'],
    });
    return this.createInvoicePdf(invoice, order);
  }

  async generatePdfSigned(
    invoiceId: number,
    token: string,
  ): Promise<SignedInvoicePdfResult> {
    const invoice = await this.verifyInvoiceDownloadToken(invoiceId, token);
    const order = await this.salesOrderRepository.findOne({
      where: { id: invoice.order_id },
      relations: ['seller', 'items', 'items.variant', 'items.variant.product'],
    });
    const pdfBuffer = await this.createInvoicePdf(invoice, order);
    return {
      pdfBuffer,
      invoiceNumber: invoice.invoice_number,
    };
  }

  /**
   * Resend invoice email
   */
  async resendEmail(invoiceId: number, currentUser: User): Promise<void> {
    const invoice = await this.findById(invoiceId, currentUser);
    const order = await this.salesOrderRepository.findOne({
      where: { id: invoice.order_id },
      relations: ['seller', 'items', 'items.variant', 'items.variant.product'],
    });
    await this.sendInvoiceEmail(invoice, order);
  }

  /**
   * Format customer name from user entity
   */
  private formatCustomerName(
    user: { first_name?: string; last_name?: string } | null,
  ): string {
    if (!user) return 'N/A';
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'N/A';
  }

  /**
   * Send invoice email with PDF attachment
   */
  private async sendInvoiceEmail(
    invoice: Invoice,
    order: SalesOrderEntity | null,
  ): Promise<void> {
    try {
      const pdfBuffer = await this.createInvoicePdf(invoice, order);
      const downloadToken = await this.createInvoiceDownloadToken(invoice.id);
      const orderNumber = order?.order_number || `ORD-${invoice.order_id}`;
      await this.mailerService.sendMail({
        to: invoice.customer_email,
        subject: `Your Adtokart Invoice #${invoice.invoice_number} for Order #${orderNumber}`,
        text: `Your invoice #${invoice.invoice_number} is attached.`,
        templatePath: path.join(
          this.configService.getOrThrow('app.workingDirectory', {
            infer: true,
          }),
          'src',
          'mail',
          'mail-templates',
          'invoice.hbs',
        ),
        context: {
          invoiceNumber: invoice.invoice_number,
          orderNumber,
          totalAmount: this.formatCurrency(invoice.total_amount),
          customerName: invoice.customer_name,
          app_name: this.configService.get('app.name', { infer: true }),
          downloadUrl: `${this.configService.getOrThrow('app.backendDomain', { infer: true })}/${this.configService.getOrThrow('app.apiPrefix', { infer: true })}/v1/invoices/${invoice.id}/download-signed?token=${encodeURIComponent(downloadToken)}`,
        },
        attachments: [
          {
            filename: `Invoice-${invoice.invoice_number}.pdf`,
            content: pdfBuffer,
          },
        ],
      });
      await this.invoiceRepository.update(invoice.id, {
        email_status: InvoiceEmailStatusEnum.SENT,
        email_sent_at: new Date(),
        last_email_attempt_at: new Date(),
      });
    } catch (error) {
      await this.invoiceRepository.update(invoice.id, {
        email_status: InvoiceEmailStatusEnum.FAILED,
        email_retry_count: invoice.email_retry_count + 1,
        last_email_attempt_at: new Date(),
      });
      throw error;
    }
  }

  private async createInvoiceDownloadToken(invoiceId: number): Promise<string> {
    const secret = this.configService.get('auth.invoiceDownloadSecret', {
      infer: true,
    });
    const expiresIn = this.configService.get('auth.invoiceDownloadExpires', {
      infer: true,
    });
    const fallbackSecret = this.configService.getOrThrow('auth.secret', {
      infer: true,
    });
    return this.jwtService.signAsync(
      {
        invoiceId,
        purpose: 'invoice_download',
      },
      {
        secret: secret ?? fallbackSecret,
        expiresIn: expiresIn ?? '15m',
      },
    );
  }

  private async verifyInvoiceDownloadToken(
    invoiceId: number,
    token: string,
  ): Promise<Invoice> {
    const secret = this.configService.get('auth.invoiceDownloadSecret', {
      infer: true,
    });
    const fallbackSecret = this.configService.getOrThrow('auth.secret', {
      infer: true,
    });
    try {
      const payload: unknown = await this.jwtService.verifyAsync(token, {
        secret: secret ?? fallbackSecret,
      });
      const typedPayload = payload as { invoiceId?: number; purpose?: string };
      if (typedPayload.purpose !== 'invoice_download') {
        throw new UnauthorizedException('Invalid invoice download token');
      }
      if (typedPayload.invoiceId !== invoiceId) {
        throw new UnauthorizedException('Invalid invoice download token');
      }
      const invoice = await this.invoiceRepository.findById(invoiceId);
      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }
      return invoice;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired invoice download token',
      );
    }
  }

  /**
   * Create invoice PDF document with multi-page support
   */
  private createInvoicePdf(
    invoice: Invoice,
    order: SalesOrderEntity | null,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });

      const fontPath = this.getInvoicePdfFontPath();
      if (fontPath) {
        doc.registerFont('InvoiceFont', fontPath);
      }
      const regularFontName = fontPath ? 'InvoiceFont' : 'Helvetica';
      const boldFontName = fontPath ? 'InvoiceFont' : 'Helvetica-Bold';

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      const pageHeight = doc.page.height;
      const pageMargin = 50;
      const footerHeight = 60;
      const maxContentY = pageHeight - pageMargin - footerHeight;
      let pageNumber = 1;
      const addPageFooter = (): void => {
        doc.fontSize(8).font(regularFontName);
        doc.text(`Page ${pageNumber}`, 50, pageHeight - 40, {
          align: 'center',
          width: doc.page.width - 100,
        });
      };
      const checkPageBreak = (requiredSpace: number): void => {
        if (doc.y + requiredSpace > maxContentY) {
          addPageFooter();
          doc.addPage();
          pageNumber++;
          doc.y = pageMargin;
        }
      };
      doc.fontSize(24).font(boldFontName).text('INVOICE', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font(regularFontName);
      doc.text(`Invoice #: ${invoice.invoice_number}`, { align: 'right' });
      doc.text(`Date: ${this.formatDate(invoice.created_at)}`, {
        align: 'right',
      });
      doc.text(`Order #: ORD-${invoice.order_id}`, { align: 'right' });
      doc.moveDown(2);
      doc.fontSize(12).font(boldFontName).text('FROM:');
      doc.fontSize(10).font(regularFontName);
      doc.text(invoice.seller_store_name);
      const sellerAddress = this.formatSellerAddress(order);
      if (sellerAddress) {
        doc.text(sellerAddress);
      }
      if (invoice.seller_tax_id) {
        doc.text(`TIN: ${invoice.seller_tax_id}`);
      } else {
        doc.text('TIN: Not Registered');
      }
      if (invoice.seller_business_registration) {
        doc.text(`Reg #: ${invoice.seller_business_registration}`);
      }
      doc.moveDown();
      doc.fontSize(12).font(boldFontName).text('TO:');
      doc.fontSize(10).font(regularFontName);
      doc.text(invoice.customer_name);
      doc.text(invoice.customer_email);
      if (invoice.customer_phone) {
        doc.text(invoice.customer_phone);
      }
      const shippingAddress = this.formatShippingAddress(invoice);
      if (shippingAddress) {
        doc.text(shippingAddress);
      }
      doc.moveDown(2);
      doc.fontSize(12).font(boldFontName).text('ITEMS:');
      doc.moveDown(0.5);
      const drawTableHeader = (): number => {
        const tableTop = doc.y;
        doc.fontSize(9).font(boldFontName);
        doc.text('Item', 50, tableTop);
        doc.text('Qty', 320, tableTop);
        doc.text('Price', 380, tableTop);
        doc.text('Total', 460, tableTop);
        doc
          .moveTo(50, tableTop + 15)
          .lineTo(545, tableTop + 15)
          .stroke();
        return tableTop + 20;
      };
      let y = drawTableHeader();
      doc.font(regularFontName).fontSize(9);
      const items = order?.items || [];
      const rowHeight = 20;
      for (const item of items) {
        checkPageBreak(rowHeight);
        if (doc.y < pageMargin + 20) {
          y = drawTableHeader();
        }
        const productName =
          item.variant?.variant_name ||
          item.variant?.product?.product_name ||
          'Product';
        const truncatedName = this.truncateText(productName, 50);
        doc.text(truncatedName, 50, y, { width: 260 });
        doc.text(String(item.quantity), 320, y);
        doc.text(this.formatCurrency(Number(item.unit_price)), 380, y);
        doc.text(this.formatCurrency(Number(item.total_price)), 460, y);
        y += rowHeight;
        doc.y = y;
      }
      checkPageBreak(100);
      doc.moveTo(50, y).lineTo(545, y).stroke();
      y += 15;
      doc.fontSize(10);
      doc.text('Subtotal:', 380, y);
      doc.text(this.formatCurrency(invoice.subtotal), 460, y);
      y += 15;
      doc.text('VAT (12%):', 380, y);
      doc.text(this.formatCurrency(invoice.tax_amount), 460, y);
      y += 15;
      doc.text('Shipping:', 380, y);
      doc.text(this.formatCurrency(invoice.shipping_amount), 460, y);
      y += 20;
      doc.fontSize(12).font(boldFontName);
      doc.text('TOTAL:', 380, y);
      doc.text(this.formatCurrency(invoice.total_amount), 460, y);
      doc.fontSize(8).font(regularFontName);
      doc.text(
        `Generated on ${this.formatDateTime(new Date())}`,
        50,
        pageHeight - 50,
        { align: 'center' },
      );
      addPageFooter();
      doc.end();
    });
  }

  /**
   * Format shipping address from invoice
   */
  private formatShippingAddress(invoice: Invoice): string {
    const parts = [
      invoice.shipping_address_line1,
      invoice.shipping_address_line2,
      invoice.shipping_city,
      invoice.shipping_state_province,
      invoice.shipping_postal_code,
      invoice.shipping_country,
    ].filter(Boolean);
    return parts.join(', ');
  }

  private formatSellerAddress(order: SalesOrderEntity | null): string | null {
    const parts = [
      order?.seller?.pickup_address,
      order?.seller?.pickup_city,
      order?.seller?.pickup_province,
      order?.seller?.pickup_postal_code,
    ].filter(Boolean);
    if (parts.length === 0) {
      return null;
    }
    const address = parts.join(', ');
    return this.sanitizeForPdf(address) ?? null;
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Format date and time for display
   */
  private formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Format currency for display (Philippine Peso)
   */
  private formatCurrency(amount: number): string {
    return `₱${amount.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  /**
   * Truncate text with ellipsis
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.substring(0, maxLength - 3)}...`;
  }

  private getInvoicePdfFontPath(): string | null {
    const candidates: readonly string[] = [
      '/usr/share/fonts/TTF/DejaVuSans.ttf',
      '/usr/share/fonts/TTF/DejaVuSansCondensed.ttf',
      '/System/Library/Fonts/Supplemental/Arial.ttf',
      '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
      '/System/Library/Fonts/Supplemental/Helvetica.ttf',
      '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
      '/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed.ttf',
      '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf',
      '/System/Library/Fonts/Supplemental/Arial Unicode.ttf',
      '/System/Library/Fonts/Supplemental/Arial Unicode MS.ttf',
      '/Library/Fonts/Arial.ttf',
      '/Library/Fonts/Arial Unicode.ttf',
    ];
    const resolvedPath = candidates.find((candidate: string) =>
      fs.existsSync(candidate),
    );
    return resolvedPath ?? null;
  }

  /**
   * Sanitize user input for PDF and email templates to prevent XSS
   */
  private sanitizeForPdf(input: string | null | undefined): string | undefined {
    if (input === null || input === undefined) return undefined;
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}
