import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuotationItemEntity } from './persistence/entities/quotation-item.entity';
import { QuotationItem } from './domain/quotation-item';
import { QuotationItemMapper } from './persistence/mappers/quotation-item.mapper';
import { QuotationItemTypeEnum } from './enums/quotation-item-type.enum';
import { AddQuotationItemsDto } from './dto/create-quotation-item.dto';
import { UpdateQuotationItemDto } from './dto/update-quotation-item.dto';
import { User } from '@/users/domain/user';
import { QuoteRequestsService } from '@/quote-requests/quote-requests.service';
import { ServicesService } from '@/services/services.service';
import { ProductsService } from '@/products/products.service';
import { SellersService } from '@/sellers/sellers.service';
import { QuoteTypeEnum } from '@/quote-requests/enums/quote-type.enum';
import { BaseBookingRepository } from '@/bookings/persistence/base-booking.repository';

/**
 * QuotationItems Service.
 *
 * Handles business logic for managing quotation line items.
 * Used by sellers to add services and materials to post-assessment quotations.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class QuotationItemsService {
  constructor(
    @InjectRepository(QuotationItemEntity)
    private readonly repository: Repository<QuotationItemEntity>,
    @Inject(forwardRef(() => QuoteRequestsService))
    private readonly quoteRequestsService: QuoteRequestsService,
    @Inject(forwardRef(() => ServicesService))
    private readonly servicesService: ServicesService,
    @Inject(forwardRef(() => ProductsService))
    private readonly productsService: ProductsService,
    @Inject(forwardRef(() => SellersService))
    private readonly sellersService: SellersService,
    private readonly bookingRepository: BaseBookingRepository,
  ) {}

  /**
   * Add items to a quotation.
   *
   * Only the seller who owns the quotation can add items.
   * Quotation must be a POST_ASSESSMENT type.
   *
   * @param input - Items to add
   * @param user - Current authenticated user (seller)
   * @returns Created quotation items
   */
  async addItems(
    input: AddQuotationItemsDto,
    user: User,
  ): Promise<QuotationItem[]> {
    // 1. Get the quotation and verify it exists
    const quotation = await this.quoteRequestsService.findById(
      input.quotation_id,
    );

    // 2. Verify user is the seller
    const seller = await this.sellersService.findByUserId(user.id);
    if (!seller || seller.id !== quotation.seller_id) {
      throw new ForbiddenException(
        'Only the seller can add items to this quotation',
      );
    }

    // 3. Verify quotation is a post-assessment type
    if (quotation.quote_type !== QuoteTypeEnum.POST_ASSESSMENT) {
      throw new BadRequestException(
        'Items can only be added to post-assessment quotations',
      );
    }

    // 4. Get max sequence order
    const maxOrder = await this.repository
      .createQueryBuilder('qi')
      .select('MAX(qi.sequence_order)', 'max')
      .where('qi.quotation_id = :quotationId', {
        quotationId: input.quotation_id,
      })
      .getRawOne();
    let nextOrder = (maxOrder?.max || 0) + 1;

    // 5. Create and validate each item
    const createdItems: QuotationItem[] = [];

    for (const itemDto of input.items) {
      // Validate service/product exists
      if (
        itemDto.item_type === QuotationItemTypeEnum.SERVICE &&
        itemDto.service_id
      ) {
        await this.servicesService.findById(itemDto.service_id);
      }
      if (
        itemDto.item_type === QuotationItemTypeEnum.MATERIAL &&
        itemDto.product_id
      ) {
        await this.productsService.findById(itemDto.product_id);
      }

      // Calculate total price
      const totalPrice = itemDto.quantity * itemDto.unit_price;

      const entity = this.repository.create({
        quotation_id: input.quotation_id,
        item_type: itemDto.item_type,
        service_id: itemDto.service_id || null,
        product_id: itemDto.product_id || null,
        name: itemDto.name,
        description: itemDto.description || null,
        quantity: itemDto.quantity,
        unit_type: itemDto.unit_type || null,
        unit_price: itemDto.unit_price,
        total_price: totalPrice,
        suggested_schedule_date: itemDto.suggested_schedule_date
          ? new Date(itemDto.suggested_schedule_date)
          : null,
        sequence_order: itemDto.sequence_order ?? nextOrder++,
        created_by: user as any,
        updated_by: user as any,
      });

      const saved = await this.repository.save(entity);
      createdItems.push(QuotationItemMapper.toDomain(saved));
    }

    // 6. Update quotation quoted_price with sum of items
    await this.updateQuotationTotal(input.quotation_id);

    // Sync linked booking(s) totals so list/detail show quoted amount instead of 0
    await this.quoteRequestsService.syncBookingTotalsFromQuotation(
      input.quotation_id,
    );

    return createdItems;
  }

  /**
   * Find quotation item by ID.
   */
  async findById(id: number): Promise<QuotationItem> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['service', 'product', 'quotation'],
    });

    if (!entity || entity.deleted_at) {
      throw new NotFoundException(`Quotation item with ID ${id} not found`);
    }

    return QuotationItemMapper.toDomain(entity);
  }

  /**
   * Find all quotation items for the quotation linked to a booking.
   * Uses the booking's quotation_id (quotation created for this booking) or
   * source_quotation_id (quotation this booking was created from when customer accepted).
   * Returns items wrapped with quotation status and quote_number for UI button decisions.
   */
  async findByBookingId(bookingId: number): Promise<{
    status: string;
    quote_number: string;
    items: QuotationItem[];
    customer_response?: string | null;
  }> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }
    const quotationId =
      booking.quotation_id ?? booking.source_quotation_id ?? null;
    if (quotationId == null) {
      return { status: '', quote_number: '', items: [] };
    }

    // Fetch quotation to get status, quote_number, and customer_response (revision request notes)
    const quotation = await this.quoteRequestsService.findById(quotationId);
    const items = await this.findByQuotationId(quotationId);

    return {
      status: quotation.status,
      quote_number: quotation.quote_number,
      items,
      customer_response: quotation.customer_response ?? null,
    };
  }

  /**
   * Find all items for a quotation.
   */
  async findByQuotationId(quotationId: number): Promise<QuotationItem[]> {
    const entities = await this.repository.find({
      where: { quotation_id: quotationId },
      relations: ['service', 'product'],
      order: { sequence_order: 'ASC', id: 'ASC' },
    });

    return entities.map((e) => QuotationItemMapper.toDomain(e));
  }

  /**
   * Update a quotation item.
   */
  async update(
    id: number,
    input: UpdateQuotationItemDto,
    user: User,
  ): Promise<QuotationItem> {
    const item = await this.findById(id);

    // Verify user is the seller
    const quotation = await this.quoteRequestsService.findById(
      item.quotation_id,
    );
    const seller = await this.sellersService.findByUserId(user.id);
    if (!seller || seller.id !== quotation.seller_id) {
      throw new ForbiddenException('Only the seller can update this item');
    }

    // Calculate new total if quantity or unit_price changed
    const quantity = input.quantity ?? item.quantity;
    const unitPrice = input.unit_price ?? item.unit_price;
    const totalPrice = quantity * unitPrice;

    await this.repository.update(id, {
      name: input.name,
      description: input.description,
      quantity: input.quantity,
      unit_type: input.unit_type,
      unit_price: input.unit_price,
      total_price: totalPrice,
      suggested_schedule_date: input.suggested_schedule_date
        ? new Date(input.suggested_schedule_date)
        : undefined,
      sequence_order: input.sequence_order,
      updated_by: user as any,
    });

    // Update quotation total
    await this.updateQuotationTotal(item.quotation_id);

    // Sync linked booking(s) totals so list/detail show quoted amount
    await this.quoteRequestsService.syncBookingTotalsFromQuotation(
      item.quotation_id,
    );

    return this.findById(id);
  }

  /**
   * Delete a quotation item.
   */
  async delete(id: number, user: User): Promise<void> {
    const item = await this.findById(id);

    // Verify user is the seller
    const quotation = await this.quoteRequestsService.findById(
      item.quotation_id,
    );
    const seller = await this.sellersService.findByUserId(user.id);
    if (!seller || seller.id !== quotation.seller_id) {
      throw new ForbiddenException('Only the seller can delete this item');
    }

    await this.repository.softDelete(id);

    // Update quotation total
    await this.updateQuotationTotal(item.quotation_id);

    // Sync linked booking(s) totals so list/detail show quoted amount
    await this.quoteRequestsService.syncBookingTotalsFromQuotation(
      item.quotation_id,
    );
  }

  /**
   * Update the quotation's quoted_price with the sum of all items.
   */
  private async updateQuotationTotal(quotationId: number): Promise<void> {
    const result = await this.repository
      .createQueryBuilder('qi')
      .select('SUM(qi.total_price)', 'total')
      .where('qi.quotation_id = :quotationId', { quotationId })
      .andWhere('qi.deleted_at IS NULL')
      .getRawOne();

    const total = Number(result?.total) || 0;

    // Update the quote_requests table directly
    await this.repository.manager.query(
      `UPDATE quote_requests SET quoted_price = $1 WHERE id = $2`,
      [total, quotationId],
    );
  }

  /**
   * Get summary of items by type for a quotation.
   */
  async getQuotationSummary(quotationId: number): Promise<{
    service_items: QuotationItem[];
    material_items: QuotationItem[];
    services_total: number;
    materials_total: number;
    grand_total: number;
  }> {
    const items = await this.findByQuotationId(quotationId);

    const serviceItems = items.filter(
      (i) => i.item_type === QuotationItemTypeEnum.SERVICE,
    );
    const materialItems = items.filter(
      (i) => i.item_type === QuotationItemTypeEnum.MATERIAL,
    );

    const servicesTotal = serviceItems.reduce(
      (sum, i) => sum + i.total_price,
      0,
    );
    const materialsTotal = materialItems.reduce(
      (sum, i) => sum + i.total_price,
      0,
    );

    return {
      service_items: serviceItems,
      material_items: materialItems,
      services_total: servicesTotal,
      materials_total: materialsTotal,
      grand_total: servicesTotal + materialsTotal,
    };
  }
}
