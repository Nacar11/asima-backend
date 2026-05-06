import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { User } from '@/users/domain/user';
import {
  Invoice,
  InvoiceStatusEnum,
  InvoiceEmailStatusEnum,
} from './domain/invoice';
import { FindAllInvoice } from './domain/find-all-invoice';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('InvoicesController', () => {
  let controller: InvoicesController;
  let service: InvoicesService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    system_admin: false,
  } as User;

  const mockInvoice: Invoice = {
    id: 1,
    invoice_number: 'INV-2024-12-00001',
    order_id: 1,
    seller_id: 1,
    user_id: 1,
    subtotal: 1000,
    tax_amount: 120,
    shipping_amount: 50,
    total_amount: 1170,
    seller_store_name: 'Test Store',
    seller_business_registration: 'BR123',
    seller_tax_id: '123-456-789',
    customer_name: 'Test User',
    customer_email: 'test@example.com',
    customer_phone: '+639123456789',
    shipping_recipient_name: 'Test User',
    shipping_address_line1: '123 Test St',
    shipping_address_line2: null,
    shipping_city: 'Makati',
    shipping_state_province: 'Metro Manila',
    shipping_postal_code: '1234',
    shipping_country: 'Philippines',
    status: InvoiceStatusEnum.VALID,
    pdf_file_path: null,
    pdf_generated_at: null,
    email_sent_at: null,
    email_status: InvoiceEmailStatusEnum.PENDING,
    email_retry_count: 0,
    last_email_attempt_at: null,
    created_by: 1,
    updated_by: 1,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockFindAllResult: FindAllInvoice = {
    data: [mockInvoice],
    totalCount: 1,
    skip: 0,
    take: 20,
  };

  const mockInvoicesService = {
    generateInvoice: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByOrderId: jest.fn(),
    generatePdf: jest.fn(),
    generatePdfSigned: jest.fn(),
    resendEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [
            {
              ttl: 60,
              limit: 10,
            },
          ],
        }),
      ],
      controllers: [InvoicesController],
      providers: [
        {
          provide: InvoicesService,
          useValue: mockInvoicesService,
        },
      ],
    }).compile();

    controller = module.get<InvoicesController>(InvoicesController);
    service = module.get<InvoicesService>(InvoicesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateInvoice', () => {
    it('should generate invoice and return response DTO', async () => {
      mockInvoicesService.generateInvoice.mockResolvedValue(mockInvoice);

      const result = await controller.generateInvoice(
        { order_id: 1 },
        mockUser,
      );

      expect(result).toEqual({
        invoice_id: 1,
        invoice_number: 'INV-2024-12-00001',
        pdf_url: '/api/v1/invoices/1/download',
      });
      expect(service.generateInvoice).toHaveBeenCalledWith(
        { order_id: 1 },
        mockUser,
      );
    });

    it('should throw ConflictException when invoice already exists', async () => {
      mockInvoicesService.generateInvoice.mockRejectedValue(
        new ConflictException('Invoice already exists for this order'),
      );

      await expect(
        controller.generateInvoice({ order_id: 1 }, mockUser),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of invoices', async () => {
      mockInvoicesService.findAll.mockResolvedValue(mockFindAllResult);

      const result = await controller.findAll({}, mockUser);

      expect(result).toEqual(mockFindAllResult);
      expect(service.findAll).toHaveBeenCalledWith({}, mockUser);
    });

    it('should pass query filters to service', async () => {
      mockInvoicesService.findAll.mockResolvedValue(mockFindAllResult);
      const query = {
        skip: 0,
        take: 10,
        seller_id: 1,
        search: 'INV-2024',
      };

      await controller.findAll(query, mockUser);

      expect(service.findAll).toHaveBeenCalledWith(query, mockUser);
    });
  });

  describe('findById', () => {
    it('should return invoice by ID', async () => {
      mockInvoicesService.findById.mockResolvedValue(mockInvoice);

      const result = await controller.findById(1, mockUser);

      expect(result).toEqual(mockInvoice);
      expect(service.findById).toHaveBeenCalledWith(1, mockUser);
    });

    it('should throw NotFoundException when invoice not found', async () => {
      mockInvoicesService.findById.mockRejectedValue(
        new NotFoundException('Invoice not found'),
      );

      await expect(controller.findById(999, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByOrderId', () => {
    it('should return invoice by order ID', async () => {
      mockInvoicesService.findByOrderId.mockResolvedValue(mockInvoice);

      const result = await controller.findByOrderId(1, mockUser);

      expect(result).toEqual(mockInvoice);
      expect(service.findByOrderId).toHaveBeenCalledWith(1, mockUser);
    });

    it('should throw NotFoundException when no invoice for order', async () => {
      mockInvoicesService.findByOrderId.mockRejectedValue(
        new NotFoundException('Invoice not found for this order'),
      );

      await expect(controller.findByOrderId(999, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('downloadPdf', () => {
    it('should return PDF buffer with correct headers', async () => {
      const pdfBuffer = Buffer.from('PDF content');
      mockInvoicesService.findById.mockResolvedValue(mockInvoice);
      mockInvoicesService.generatePdf.mockResolvedValue(pdfBuffer);

      const mockRes = {
        set: jest.fn(),
        end: jest.fn(),
      };

      await controller.downloadPdf(1, mockUser, mockRes as never);

      expect(mockRes.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition':
          'attachment; filename="Invoice-INV-2024-12-00001.pdf"',
        'Content-Length': pdfBuffer.length,
      });
      expect(mockRes.end).toHaveBeenCalledWith(pdfBuffer);
    });
  });

  describe('downloadPdfSigned', () => {
    it('should return PDF with signed token', async () => {
      const pdfBuffer = Buffer.from('PDF content');
      mockInvoicesService.generatePdfSigned.mockResolvedValue({
        pdfBuffer,
        invoiceNumber: 'INV-2024-12-00001',
      });

      const mockRes = {
        set: jest.fn(),
        end: jest.fn(),
      };

      await controller.downloadPdfSigned(1, 'valid-token', mockRes as never);

      expect(mockRes.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition':
          'attachment; filename="Invoice-INV-2024-12-00001.pdf"',
        'Content-Length': pdfBuffer.length,
      });
      expect(mockRes.end).toHaveBeenCalledWith(pdfBuffer);
    });
  });

  describe('resendEmail', () => {
    it('should resend invoice email', async () => {
      mockInvoicesService.resendEmail.mockResolvedValue(undefined);

      const result = await controller.resendEmail(1, mockUser);

      expect(result).toEqual({
        success: true,
        message: 'Email sent successfully',
      });
      expect(service.resendEmail).toHaveBeenCalledWith(1, mockUser);
    });

    it('should throw NotFoundException when invoice not found', async () => {
      mockInvoicesService.resendEmail.mockRejectedValue(
        new NotFoundException('Invoice not found'),
      );

      await expect(controller.resendEmail(999, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
