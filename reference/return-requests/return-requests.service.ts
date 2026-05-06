import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { User } from '@/users/domain/user';
import { OrderTrackingService } from '@/order-tracking/order-tracking.service';
import { OrderEventTypeEnum } from '@/order-tracking/domain/event-type.enum';
import { OrderStatusEnum } from '@/sales-orders/domain/order-status.enum';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { MediaUsersService } from '@/media/users/services/media-users.service';
import { MediaRepository } from '@/media/persistence/repositories/media.repository';
import { ConfigService } from '@nestjs/config';
import {
  ReturnRequestRepository,
  PaginatedReturnRequests,
} from './persistence/repositories/return-request.repository';
import { ReturnRequestItemRepository } from './persistence/repositories/return-request-item.repository';
import { ReturnRequestEntity } from './persistence/entities/return-request.entity';
import { ReturnRequestItemEntity } from './persistence/entities/return-request-item.entity';
import { ReturnRequestMediaMappingEntity } from '@/media/persistence/entities/return-request-media-mapping.entity';
import { ReturnRequest } from './domain/return-request';
import { ReturnRequestStatusEnum } from './domain/return-request-status.enum';
import { ReturnRequestItemStatusEnum } from './domain/return-request-item-status.enum';
import {
  CreateReturnRequestDto,
  ApproveReturnDto,
  RejectReturnDto,
  SchedulePickupDto,
  MarkPickedUpDto,
  MarkReceivedDto,
  ProcessRefundDto,
  QueryReturnRequestDto,
  QueryReturnRequestDevExtremeDto,
} from './dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { NotificationsService } from '@/notifications/notifications.service';
import { PaymentRefundStatusEnum } from './domain/payment-refund-status.enum';
import { PaymentRefundMethodEnum } from './domain/payment-refund-method.enum';
import { CheckoutPaymentsService } from '@/checkout-payments/checkout-payments.service';
import { CheckoutPaymentStatusEnum } from '@/checkout-payments/enums/checkout-payment-status.enum';
import { WalletsService } from '@/wallets/wallets.service';
import { ProcessPayoutDto } from './dto/process-payout.dto';
import { PayoutsService } from '@/payouts/payouts.service';

// Default return window in days if parameter not configured
const DEFAULT_RETURN_WINDOW_DAYS = 7;

// File upload constraints
const MAX_RETURN_EVIDENCE_FILES = 5;
const MAX_RETURN_EVIDENCE_IMAGES = 4;
const MAX_RETURN_EVIDENCE_VIDEOS = 1;
const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB per image
const MAX_VIDEO_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB per video
const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];
const ALLOWED_VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime'];

// Refund validation thresholds
const MAX_REFUND_OVERRIDE_PERCENT = 20; // Maximum 20% over calculated amount
const REFUND_OVERRIDE_THRESHOLD_PERCENT = 5; // Requires override flag above 5% difference

// Return number generation
const MAX_RETURN_NUMBER_RETRIES = 3;

@Injectable()
export class ReturnRequestsService {
  private readonly logger = new Logger(ReturnRequestsService.name);

  constructor(
    private readonly returnRequestRepository: ReturnRequestRepository,
    private readonly returnRequestItemRepository: ReturnRequestItemRepository,
    private readonly orderTrackingService: OrderTrackingService,
    private readonly mediaUsersService: MediaUsersService,
    private readonly mediaRepository: MediaRepository,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    @InjectRepository(SalesOrderEntity)
    private readonly salesOrderRepository: Repository<SalesOrderEntity>,
    @InjectRepository(SalesOrderItemEntity)
    private readonly salesOrderItemRepository: Repository<SalesOrderItemEntity>,
    @InjectRepository(ReturnRequestEntity)
    private readonly returnRequestEntityRepository: Repository<ReturnRequestEntity>,
    @InjectRepository(ReturnRequestItemEntity)
    private readonly returnRequestItemEntityRepository: Repository<ReturnRequestItemEntity>,
    @InjectRepository(ReturnRequestMediaMappingEntity)
    private readonly returnRequestMediaMappingRepository: Repository<ReturnRequestMediaMappingEntity>,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly checkoutPaymentsService: CheckoutPaymentsService,
    private readonly walletsService: WalletsService,
    private readonly payoutsService: PayoutsService,
  ) {}

  /**
   * Create a return request with partial items (Customer)
   */
  async createReturnRequest(
    orderId: number,
    dto: CreateReturnRequestDto,
    user: User,
    files?: Express.Multer.File[],
  ): Promise<ReturnRequest> {
    // 1. Validate order exists
    const order = await this.salesOrderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'seller'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // 2. Validate order belongs to user
    if (order.user_id !== user.id) {
      throw new ForbiddenException(
        'You can only request returns for your own orders',
      );
    }

    // 3. Validate order status (DELIVERED or COMPLETED)
    if (
      ![OrderStatusEnum.DELIVERED, OrderStatusEnum.COMPLETED].includes(
        order.status,
      )
    ) {
      throw new BadRequestException(
        `Order cannot be returned. Current status: ${order.status}. Order must be in DELIVERED or COMPLETED status.`,
      );
    }

    // 3a. Validate payment was received (security check)
    const isCod = order.payment_method === 'cod';

    if (!isCod) {
      // For non-COD orders, verify payment was completed
      const payments =
        await this.checkoutPaymentsService.findPaymentsBySalesOrderId(orderId);

      const completedPayment = payments.find(
        (p) =>
          ['maya'].includes(p.payment_gateway ?? '') &&
          [
            CheckoutPaymentStatusEnum.COMPLETED,
            CheckoutPaymentStatusEnum.PARTIALLY_REFUNDED,
          ].includes(p.status as CheckoutPaymentStatusEnum),
      );

      if (!completedPayment) {
        throw new BadRequestException(
          `Cannot create return request. Order payment was not completed. ` +
            `This order should not have been delivered without payment. ` +
            `Please contact support to resolve this issue.`,
        );
      }
    }
    // COD orders: Payment received on delivery, allow return request

    // 4. Validate return window (order must be within allowed return period)
    this.validateReturnWindow(order);

    // 5. Validate no duplicate sales_order_item_ids in request
    const itemIds = dto.data.items.map((item) => item.sales_order_item_id);
    const duplicateIds = itemIds.filter(
      (id, index) => itemIds.indexOf(id) !== index,
    );
    if (duplicateIds.length > 0) {
      throw new BadRequestException(
        `Duplicate items found in return request: ${[...new Set(duplicateIds)].join(', ')}. Each item can only appear once.`,
      );
    }

    // 6. Validate items exist in order and quantities are valid
    const orderItemsMap = new Map(order.items.map((item) => [item.id, item]));

    let calculatedRefundAmount = 0;
    const returnItems: {
      salesOrderItem: SalesOrderItemEntity;
      quantity: number;
      returnAmount: number;
    }[] = [];

    for (const returnItemDto of dto.data.items) {
      const orderItem = orderItemsMap.get(returnItemDto.sales_order_item_id);

      if (!orderItem) {
        throw new BadRequestException(
          `Order item with ID ${returnItemDto.sales_order_item_id} not found in this order`,
        );
      }

      // Validate that item has either variant_id (for products) or service_id (for services)
      if (
        orderItem.item_type === 'product' &&
        (!orderItem.variant_id || orderItem.variant_id === null)
      ) {
        throw new BadRequestException(
          `Order item with ID ${returnItemDto.sales_order_item_id} is a product item but missing variant_id.`,
        );
      }

      if (
        orderItem.item_type === 'service' &&
        (!orderItem.service_id || orderItem.service_id === null)
      ) {
        throw new BadRequestException(
          `Order item with ID ${returnItemDto.sales_order_item_id} is a service item but missing service_id.`,
        );
      }

      // Validate quantity doesn't exceed available quantity (ordered - already returned)
      const availableToReturn =
        orderItem.quantity - (orderItem.quantity_returned || 0);
      if (returnItemDto.quantity > availableToReturn) {
        throw new BadRequestException(
          `Cannot return ${returnItemDto.quantity} items for item ID ${orderItem.id}. Only ${availableToReturn} are available to return (${orderItem.quantity_returned || 0} already returned).`,
        );
      }

      const returnAmount =
        returnItemDto.quantity * Number(orderItem.unit_price);
      calculatedRefundAmount += returnAmount;

      returnItems.push({
        salesOrderItem: orderItem,
        quantity: returnItemDto.quantity,
        returnAmount,
      });
    }

    // 7. Merge multipart files with base64 files
    const allFiles: Express.Multer.File[] = [
      ...(files || []),
      ...(dto.data.base64_files || []),
    ];

    // Pre-uploaded media IDs (will be validated below)
    const mediaIds = dto.data.media_ids || [];

    // 8. Validate evidence counts and sizes (4 images + 1 video max)
    const imageFiles: Express.Multer.File[] = [];
    const videoFiles: Express.Multer.File[] = [];
    for (const file of allFiles) {
      if (ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
        imageFiles.push(file);
      } else if (ALLOWED_VIDEO_MIME_TYPES.includes(file.mimetype)) {
        videoFiles.push(file);
      } else {
        throw new BadRequestException(
          `Invalid file type: ${file.mimetype}. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, MOV) are allowed.`,
        );
      }
      if (file.originalname && file.originalname.length > 255) {
        throw new BadRequestException(
          'File name too long. Maximum 255 characters.',
        );
      }
      const maxSizeBytes = ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)
        ? MAX_IMAGE_FILE_SIZE_BYTES
        : MAX_VIDEO_FILE_SIZE_BYTES;
      if (file.size > maxSizeBytes) {
        throw new BadRequestException(
          `File "${file.originalname}" exceeds ${maxSizeBytes / 1024 / 1024}MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
        );
      }
    }

    // 9. Validate pre-uploaded media IDs ownership + compute evidence counts
    let validatedMediaIds: number[] = [];
    let preUploadedImageCount = 0;
    let preUploadedVideoCount = 0;
    if (mediaIds.length > 0) {
      const mediaItems = await this.mediaRepository.findByIds(mediaIds);
      const mediaMap = new Map(mediaItems.map((m) => [m.id, m]));
      const invalidMediaIds: number[] = [];
      const unauthorizedMediaIds: number[] = [];
      for (const mediaId of mediaIds) {
        const media = mediaMap.get(mediaId);
        if (!media) {
          invalidMediaIds.push(mediaId);
        } else if (media.created_by !== user.id) {
          unauthorizedMediaIds.push(mediaId);
        } else if (
          media.mime_type &&
          ALLOWED_IMAGE_MIME_TYPES.includes(media.mime_type)
        ) {
          preUploadedImageCount++;
        } else if (
          media.mime_type &&
          ALLOWED_VIDEO_MIME_TYPES.includes(media.mime_type)
        ) {
          preUploadedVideoCount++;
        } else {
          invalidMediaIds.push(mediaId);
        }
      }
      if (invalidMediaIds.length > 0) {
        throw new BadRequestException(
          `Media not found: ${invalidMediaIds.join(', ')}`,
        );
      }
      if (unauthorizedMediaIds.length > 0) {
        throw new ForbiddenException(
          `You can only attach media you own. Unauthorized media IDs: ${unauthorizedMediaIds.join(', ')}`,
        );
      }
      validatedMediaIds = [...new Set(mediaIds)];
    }
    const totalEvidenceCount =
      imageFiles.length + videoFiles.length + validatedMediaIds.length;
    const totalImageEvidenceCount = imageFiles.length + preUploadedImageCount;
    const totalVideoEvidenceCount = videoFiles.length + preUploadedVideoCount;
    if (totalEvidenceCount > MAX_RETURN_EVIDENCE_FILES) {
      throw new BadRequestException(
        `Maximum ${MAX_RETURN_EVIDENCE_FILES} evidence files allowed. ` +
          `You provided ${totalEvidenceCount} total.`,
      );
    }
    if (totalImageEvidenceCount > MAX_RETURN_EVIDENCE_IMAGES) {
      throw new BadRequestException(
        `Maximum ${MAX_RETURN_EVIDENCE_IMAGES} images allowed. ` +
          `You provided ${totalImageEvidenceCount} images.`,
      );
    }
    if (totalVideoEvidenceCount > MAX_RETURN_EVIDENCE_VIDEOS) {
      throw new BadRequestException(
        `Maximum ${MAX_RETURN_EVIDENCE_VIDEOS} video allowed. ` +
          `You provided ${totalVideoEvidenceCount} videos.`,
      );
    }

    // 11. Create return request in transaction FIRST (validates and reserves before file upload)
    // This ensures no files are uploaded if validation fails
    // Retry logic for return number collision handling
    if (MAX_RETURN_NUMBER_RETRIES < 1) {
      throw new Error('MAX_RETURN_NUMBER_RETRIES must be at least 1');
    }
    let result: number | undefined;
    let retryCount = 0;

    while (retryCount < MAX_RETURN_NUMBER_RETRIES) {
      try {
        const returnNumber = this.generateReturnNumber();

        result = await this.dataSource.transaction(async (manager) => {
          // Lock the order row to prevent concurrent return request creation
          await manager.findOne(SalesOrderEntity, {
            where: { id: orderId },
            lock: { mode: 'pessimistic_write' },
          });

          // Check for existing return request within transaction (atomic check)
          const existingRequest = await manager.findOne(ReturnRequestEntity, {
            where: { order_id: orderId, deleted_at: IsNull() },
          });

          if (existingRequest) {
            throw new BadRequestException(
              `A return request already exists for this order (Status: ${existingRequest.status}). Only one return request is allowed per order - please include all items you wish to return in a single request.`,
            );
          }

          // Create return request
          const returnRequestEntity = manager.create(ReturnRequestEntity, {
            order_id: orderId,
            user_id: user.id,
            seller_id: order.seller_id,
            return_number: returnNumber,
            status: ReturnRequestStatusEnum.PENDING,
            reason: dto.data.reason,
            previous_order_status: order.status,
            calculated_refund_amount: calculatedRefundAmount,
            requested_at: new Date(),
            created_by: { id: user.id } as any,
          });

          const savedReturnRequest = await manager.save(returnRequestEntity);

          // Create return request items (for both product and service items)
          const returnRequestItems = returnItems.map((item) =>
            manager.create(ReturnRequestItemEntity, {
              return_request_id: savedReturnRequest.id,
              sales_order_item_id: item.salesOrderItem.id,
              variant_id: item.salesOrderItem.variant_id ?? null,
              service_id: item.salesOrderItem.service_id ?? null,
              quantity_ordered: item.salesOrderItem.quantity,
              quantity_returning: item.quantity,
              unit_price: item.salesOrderItem.unit_price,
              return_amount: item.returnAmount,
              item_status: ReturnRequestItemStatusEnum.PENDING,
              created_by: { id: user.id } as any,
            }),
          );

          await manager.save(returnRequestItems);

          // Update order status — protected from races by the pessimistic_write
          // lock acquired above; no WHERE guard needed here.
          await manager.update(SalesOrderEntity, orderId, {
            status: OrderStatusEnum.RETURN_REQUESTED,
            updated_by: { id: user.id } as any,
          });

          return savedReturnRequest.id;
        });

        // Success - break out of retry loop
        break;
      } catch (error) {
        if (this.isReturnNumberCollision(error)) {
          retryCount++;
          if (retryCount >= MAX_RETURN_NUMBER_RETRIES) {
            throw new ConflictException(
              'Failed to generate unique return number after multiple attempts. Please try again.',
            );
          }
          // Continue to next iteration for retry
          continue;
        }
        // Re-throw non-collision errors
        throw error;
      }
    }

    // 12. Upload media files in parallel and link to return request
    // Files are uploaded after return request creation to avoid orphans on validation failure
    // Pre-validated media_ids are used directly (ownership already verified in step 10)
    const uploadedMediaIds: number[] = [...validatedMediaIds];
    const failedUploads: string[] = [];

    if (allFiles.length > 0) {
      const uploadResults = await Promise.allSettled(
        allFiles.map((file) =>
          this.mediaUsersService.createMediaFromFile(file, user.id),
        ),
      );

      uploadResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          uploadedMediaIds.push(result.value.id);
        } else {
          const fileName = allFiles[index].originalname;
          failedUploads.push(fileName);
          this.logger.warn(`Failed to upload file ${fileName}:`, result.reason);
        }
      });
    }

    // 13. Link media to return request
    // This must succeed - if it fails, we throw to alert the user
    if (uploadedMediaIds.length > 0) {
      const mediaMappings = uploadedMediaIds.map((mediaId, index) =>
        this.returnRequestMediaMappingRepository.create({
          return_request_id: result,
          media_id: mediaId,
          display_order: index,
          created_by: user.id,
        }),
      );
      await this.returnRequestMediaMappingRepository.save(mediaMappings);
    }

    // Log warning if some uploads failed (return request still succeeded)
    if (failedUploads.length > 0) {
      this.logger.warn(
        `Return request ${result} created but ${failedUploads.length} file(s) failed to upload: ${failedUploads.join(', ')}`,
      );
    }

    // Create tracking event
    await this.orderTrackingService.createEvent(
      orderId,
      OrderEventTypeEnum.RETURN_REQUESTED,
      `Return requested by customer. Reason: ${dto.data.reason}`,
      user,
    );

    if (result === undefined) {
      throw new ConflictException(
        'Return request creation did not complete. Please try again.',
      );
    }

    const returnRequest = (await this.returnRequestRepository.findById(
      result,
    )) as ReturnRequest;

    // Notify seller about return request (non-blocking)
    if (order.seller && order.seller.user_id) {
      // Build return items for email notification
      const returnItems = returnRequest.items?.map((item) => {
        const imageUrl =
          item.variant?.product?.image_url ||
          item.variant?.product?.thumbnail_url ||
          item.service?.primary_image_url;
        return {
          product_name: item.variant?.product?.name || item.service?.title,
          variant_name: item.variant?.name,
          image_url: imageUrl ?? undefined,
          quantity_returning: item.quantity_returning,
          quantity_ordered: item.quantity_ordered,
          unit_price: item.unit_price,
          return_amount: item.return_amount,
        };
      });

      this.notificationsService
        .sendReturnRequested(
          order.seller.user_id,
          returnRequest.id,
          returnRequest.return_number,
          order.order_number,
          `${user.first_name} ${user.last_name}`,
          true, // send email
          order.seller.user?.email ?? undefined,
          order.seller.store_name,
          {
            returnItems,
            refundAmount: returnRequest.calculated_refund_amount ?? undefined,
            returnReason: returnRequest.reason,
          },
        )
        .catch((error) => {
          this.logger.error(
            'Failed to send return request notification:',
            error,
          );
        });

      // Notify buyer of return request confirmation
      this.notificationsService
        .sendReturnRequestedToBuyer(
          user.id,
          returnRequest.id,
          returnRequest.return_number,
          true, // send email
          user.email ?? undefined,
          `${user.first_name} ${user.last_name}`,
          {
            returnItems,
            refundAmount: returnRequest.calculated_refund_amount ?? undefined,
            returnReason: returnRequest.reason,
            orderNumber: order.order_number,
            sellerName: order.seller?.store_name,
          },
        )
        .catch((error) => {
          this.logger.error(
            'Failed to send return request confirmation to buyer:',
            error,
          );
        });
    }

    return returnRequest;
  }

  /**
   * Approve return request (Seller)
   */
  async approveReturnRequest(
    orderId: number,
    dto: ApproveReturnDto,
    user: User,
    sellerId: number,
  ): Promise<ReturnRequest> {
    const returnRequest = await this.validateSellerAccess(orderId, sellerId);

    if (returnRequest.status !== ReturnRequestStatusEnum.PENDING) {
      throw new BadRequestException(
        `Return request cannot be approved. Current status: ${returnRequest.status}`,
      );
    }

    await this.ensureSellerWallet(sellerId);

    this.logger.log(`Return request approved`, {
      orderId,
      returnRequestId: returnRequest.id,
      previousStatus: returnRequest.status,
      newStatus: ReturnRequestStatusEnum.APPROVED,
      userId: user.id,
      sellerId,
      notes: dto.notes || null,
    });

    await this.returnRequestEntityRepository.update(returnRequest.id, {
      status: ReturnRequestStatusEnum.APPROVED,
      approval_notes: dto.notes || null,
      approved_at: new Date(),
      approved_by: user.id,
      updated_by: { id: user.id } as any,
    });

    await this.orderTrackingService.createEvent(
      orderId,
      OrderEventTypeEnum.RETURN_APPROVED,
      `Return request approved by seller.${dto.notes ? ` Notes: ${dto.notes}` : ''}`,
      user,
    );

    const updatedRequest = (await this.returnRequestRepository.findById(
      returnRequest.id,
    )) as ReturnRequest;

    // Build return items for email notification (used by both customer and seller notifications)
    const returnItems = updatedRequest.items?.map((item) => ({
      product_name: item.variant?.product?.name,
      variant_name: item.variant?.name,
      image_url:
        item.variant?.product?.image_url ||
        item.variant?.product?.thumbnail_url,
      quantity_returning: item.quantity_returning,
      quantity_ordered: item.quantity_ordered,
      unit_price: item.unit_price,
      return_amount: item.return_amount,
    }));

    // Notify customer about approval (non-blocking)
    const order = await this.salesOrderRepository.findOne({
      where: { id: orderId },
      relations: ['user', 'seller'],
    });
    if (order?.user) {
      this.notificationsService
        .sendReturnApproved(
          order.user.id,
          updatedRequest.id,
          updatedRequest.return_number,
          true, // send email
          order.user.email,
          `${order.user.first_name} ${order.user.last_name}`,
          {
            returnItems,
            refundAmount: updatedRequest.calculated_refund_amount ?? undefined,
            returnReason: updatedRequest.reason,
            orderNumber: order.order_number,
            sellerName: order.seller?.store_name,
          },
        )
        .catch((error) => {
          this.logger.error(
            'Failed to send return approved notification:',
            error,
          );
        });
    }

    // Notify seller about approval (non-blocking)
    if (
      returnRequest.seller_id !== null &&
      returnRequest.seller_id !== undefined
    ) {
      const seller = await this.userRepository.findOne({
        where: { id: returnRequest.seller_id },
      });
      if (seller) {
        this.notificationsService
          .sendReturnApprovedToSeller(
            returnRequest.seller_id,
            updatedRequest.id,
            updatedRequest.return_number,
            order?.order_number || '',
            order?.user
              ? `${order.user.first_name} ${order.user.last_name}`
              : '',
            true, // send email
            seller.email,
            seller.first_name,
            {
              returnItems,
              refundAmount:
                updatedRequest.calculated_refund_amount ?? undefined,
              returnReason: updatedRequest.reason,
            },
          )
          .catch((error) => {
            this.logger.error(
              'Failed to send return approved notification to seller:',
              error,
            );
          });
      }
    }

    return updatedRequest;
  }

  /**
   * Reject return request (Seller)
   */
  async rejectReturnRequest(
    orderId: number,
    dto: RejectReturnDto,
    user: User,
    sellerId: number,
  ): Promise<ReturnRequest> {
    const returnRequest = await this.validateSellerAccess(orderId, sellerId);

    if (returnRequest.status !== ReturnRequestStatusEnum.PENDING) {
      throw new BadRequestException(
        `Return request cannot be rejected. Current status: ${returnRequest.status}`,
      );
    }

    await this.ensureSellerWallet(sellerId);

    this.logger.log(`Return request rejected`, {
      orderId,
      returnRequestId: returnRequest.id,
      previousStatus: returnRequest.status,
      newStatus: ReturnRequestStatusEnum.REJECTED,
      userId: user.id,
      sellerId,
      reason: dto.rejection_reason,
    });

    await this.dataSource.transaction(async (manager) => {
      // Update return request
      await manager.update(ReturnRequestEntity, returnRequest.id, {
        status: ReturnRequestStatusEnum.REJECTED,
        rejection_reason: dto.rejection_reason,
        rejected_at: new Date(),
        rejected_by: user.id,
        updated_by: { id: user.id } as any,
      });

      // Revert order status to previous — fall back to DELIVERED if not recorded
      const revertStatus =
        (returnRequest.previous_order_status as OrderStatusEnum) ??
        OrderStatusEnum.DELIVERED;
      await manager.update(SalesOrderEntity, orderId, {
        status: revertStatus,
        updated_by: { id: user.id } as any,
      });
    });

    await this.orderTrackingService.createEvent(
      orderId,
      OrderEventTypeEnum.RETURN_REJECTED,
      `Return request rejected. Reason: ${dto.rejection_reason}`,
      user,
    );

    const updatedRequest = (await this.returnRequestRepository.findById(
      returnRequest.id,
    )) as ReturnRequest;

    // Notify customer about rejection (non-blocking)
    const order = await this.salesOrderRepository.findOne({
      where: { id: orderId },
      relations: ['user', 'seller'],
    });
    if (order?.user) {
      // Build return items for email notification
      const returnItems = updatedRequest.items?.map((item) => ({
        product_name: item.variant?.product?.name,
        variant_name: item.variant?.name,
        image_url:
          item.variant?.product?.image_url ||
          item.variant?.product?.thumbnail_url,
        quantity_returning: item.quantity_returning,
        quantity_ordered: item.quantity_ordered,
        unit_price: item.unit_price,
        return_amount: item.return_amount,
      }));

      this.notificationsService
        .sendReturnRejected(
          order.user.id,
          updatedRequest.id,
          updatedRequest.return_number,
          dto.rejection_reason,
          true, // send email
          order.user.email,
          `${order.user.first_name} ${order.user.last_name}`,
          {
            returnItems,
            orderNumber: order.order_number,
            sellerName: order.seller?.store_name,
          },
        )
        .catch((error) => {
          this.logger.error(
            'Failed to send return rejected notification:',
            error,
          );
        });
    }

    return updatedRequest;
  }

  /**
   * Schedule pickup for approved return (Admin/Operations)
   */
  async schedulePickup(
    orderId: number,
    dto: SchedulePickupDto,
    user: User,
    sellerId: number,
  ): Promise<ReturnRequest> {
    const returnRequest = await this.validateSellerAccess(orderId, sellerId);

    if (returnRequest.status !== ReturnRequestStatusEnum.APPROVED) {
      throw new BadRequestException(
        `Pickup cannot be scheduled. Current status: ${returnRequest.status}. Must be APPROVED.`,
      );
    }

    await this.ensureSellerWallet(sellerId);

    const pickupDate = new Date(dto.pickup_date);

    this.logger.log(`Return pickup scheduled`, {
      orderId,
      returnRequestId: returnRequest.id,
      previousStatus: returnRequest.status,
      newStatus: ReturnRequestStatusEnum.PICKUP_SCHEDULED,
      userId: user.id,
      sellerId,
      pickupDate: pickupDate.toISOString(),
    });

    await this.returnRequestEntityRepository.update(returnRequest.id, {
      status: ReturnRequestStatusEnum.PICKUP_SCHEDULED,
      pickup_scheduled_at: new Date(),
      pickup_scheduled_date: pickupDate,
      pickup_scheduled_by: user.id,
      pickup_notes: dto.notes || null,
      updated_by: { id: user.id } as any,
    });

    await this.orderTrackingService.createEvent(
      orderId,
      OrderEventTypeEnum.RETURN_PICKUP_SCHEDULED,
      `Return pickup scheduled for ${pickupDate.toISOString().split('T')[0]}${dto.notes ? `. Notes: ${dto.notes}` : ''}`,
      user,
    );

    const updatedRequest = (await this.returnRequestRepository.findById(
      returnRequest.id,
    )) as ReturnRequest;

    // Notify customer about pickup schedule (non-blocking)
    const order = await this.salesOrderRepository.findOne({
      where: { id: orderId },
      relations: ['user'],
    });
    if (order?.user) {
      this.notificationsService
        .sendReturnPickupScheduled(
          order.user.id,
          updatedRequest.id,
          updatedRequest.return_number,
          pickupDate,
          true, // send email
          order.user.email,
          `${order.user.first_name} ${order.user.last_name}`,
        )
        .catch((error) => {
          this.logger.error(
            'Failed to send pickup scheduled notification:',
            error,
          );
        });
    }

    // Notify seller about pickup schedule (non-blocking)
    if (
      returnRequest.seller_id !== null &&
      returnRequest.seller_id !== undefined
    ) {
      const seller = await this.userRepository.findOne({
        where: { id: returnRequest.seller_id },
      });
      if (seller) {
        this.notificationsService
          .sendReturnPickupScheduledToSeller(
            returnRequest.seller_id,
            updatedRequest.id,
            updatedRequest.return_number,
            order?.order_number || '',
            order?.user
              ? `${order.user.first_name} ${order.user.last_name}`
              : '',
            pickupDate,
            true, // send email
            seller.email,
            seller.first_name,
          )
          .catch((error) => {
            this.logger.error(
              'Failed to send pickup scheduled notification to seller',
              error,
            );
          });
      }
    }

    return updatedRequest;
  }

  /**
   * Mark return as picked up (Admin/Operations)
   */
  async markPickedUp(
    orderId: number,
    dto: MarkPickedUpDto,
    user: User,
    sellerId: number,
  ): Promise<ReturnRequest> {
    const returnRequest = await this.validateSellerAccess(orderId, sellerId);

    if (returnRequest.status !== ReturnRequestStatusEnum.PICKUP_SCHEDULED) {
      throw new BadRequestException(
        `Return cannot be marked as picked up. Current status: ${returnRequest.status}. Must be PICKUP_SCHEDULED.`,
      );
    }

    await this.ensureSellerWallet(sellerId);

    this.logger.log(`Return marked as picked up`, {
      orderId,
      returnRequestId: returnRequest.id,
      previousStatus: returnRequest.status,
      newStatus: ReturnRequestStatusEnum.PICKED_UP,
      userId: user.id,
      sellerId,
    });

    await this.returnRequestEntityRepository.update(returnRequest.id, {
      status: ReturnRequestStatusEnum.PICKED_UP,
      picked_up_at: new Date(),
      picked_up_by: user.id,
      pickup_notes: dto.notes || null,
      updated_by: { id: user.id } as any,
    });

    await this.orderTrackingService.createEvent(
      orderId,
      OrderEventTypeEnum.RETURN_PICKED_UP,
      `Return item picked up${dto.notes ? `. Notes: ${dto.notes}` : ''}`,
      user,
    );

    const pickedUpRequest = (await this.returnRequestRepository.findById(
      returnRequest.id,
    )) as ReturnRequest;

    // Notify customer about pickup (non-blocking)
    const order = await this.salesOrderRepository.findOne({
      where: { id: orderId },
      relations: ['user'],
    });
    if (order?.user) {
      this.notificationsService
        .sendReturnPickedUp(
          order.user.id,
          pickedUpRequest.id,
          pickedUpRequest.return_number,
          true, // send email
          order.user.email,
          `${order.user.first_name} ${order.user.last_name}`,
        )
        .catch((error) => {
          this.logger.error('Failed to send picked up notification:', error);
        });
    }

    // Notify seller about pickup completion (non-blocking)
    if (
      returnRequest.seller_id !== null &&
      returnRequest.seller_id !== undefined
    ) {
      const seller = await this.userRepository.findOne({
        where: { id: returnRequest.seller_id },
      });
      if (seller) {
        this.notificationsService
          .sendReturnPickedUpToSeller(
            returnRequest.seller_id,
            pickedUpRequest.id,
            pickedUpRequest.return_number,
            order?.order_number || '',
            order?.user
              ? `${order.user.first_name} ${order.user.last_name}`
              : '',
            true, // send email
            seller.email,
            seller.first_name,
          )
          .catch((error) => {
            this.logger.error(
              'Failed to send picked up notification to seller',
              error,
            );
          });
      }
    }

    return pickedUpRequest;
  }

  /**
   * Mark return as received at seller location (Seller)
   */
  async markReturnReceived(
    orderId: number,
    dto: MarkReceivedDto,
    user: User,
    sellerId: number,
  ): Promise<ReturnRequest> {
    const returnRequest = await this.validateSellerAccess(orderId, sellerId);

    if (returnRequest.status !== ReturnRequestStatusEnum.PICKED_UP) {
      throw new BadRequestException(
        `Return request cannot be marked as received. Current status: ${returnRequest.status}. Must be PICKED_UP.`,
      );
    }

    await this.ensureSellerWallet(sellerId);

    this.logger.log(`Return items received by seller`, {
      orderId,
      returnRequestId: returnRequest.id,
      previousStatus: returnRequest.status,
      newStatus: ReturnRequestStatusEnum.RECEIVED,
      userId: user.id,
      sellerId,
    });

    await this.dataSource.transaction(async (manager) => {
      // Update return request
      await manager.update(ReturnRequestEntity, returnRequest.id, {
        status: ReturnRequestStatusEnum.RECEIVED,
        received_at: new Date(),
        received_by: user.id,
        updated_by: { id: user.id } as any,
      });

      // Update all items to received status
      await manager.update(
        ReturnRequestItemEntity,
        { return_request_id: returnRequest.id },
        { item_status: ReturnRequestItemStatusEnum.RECEIVED },
      );
    });

    await this.orderTrackingService.createEvent(
      orderId,
      OrderEventTypeEnum.RETURN_RECEIVED,
      `Returned items received by seller${dto.notes ? `. Notes: ${dto.notes}` : ''}`,
      user,
    );

    const receivedRequest = (await this.returnRequestRepository.findById(
      returnRequest.id,
    )) as ReturnRequest;

    // Notify customer about item received (non-blocking)
    const order = await this.salesOrderRepository.findOne({
      where: { id: orderId },
      relations: ['user'],
    });
    if (order?.user) {
      this.notificationsService
        .sendReturnReceived(
          order.user.id,
          receivedRequest.id,
          receivedRequest.return_number,
          true, // send email
          order.user.email,
          `${order.user.first_name} ${order.user.last_name}`,
        )
        .catch((error) => {
          this.logger.error(
            'Failed to send return received notification:',
            error,
          );
        });
    }

    // Notify seller about return received (non-blocking) - this is redundant since the seller is the one performing this action
    // But we'll keep it for consistency in case admin/operations perform this action

    return receivedRequest;
  }

  /**
   * Process refund after items received (Seller)
   * Simplified flow: RECEIVED -> REFUNDED (no inspection step)
   */
  async processRefund(
    orderId: number,
    dto: ProcessRefundDto,
    user: User,
    sellerId: number,
  ): Promise<ReturnRequest> {
    const returnRequest = await this.validateSellerAccess(orderId, sellerId);

    if (returnRequest.status !== ReturnRequestStatusEnum.RECEIVED) {
      throw new BadRequestException(
        `Refund cannot be processed. Current status: ${returnRequest.status}. Must be RECEIVED.`,
      );
    }

    if (
      returnRequest.payment_refund_status &&
      returnRequest.payment_refund_status !== PaymentRefundStatusEnum.FAILED
    ) {
      throw new BadRequestException(
        `Refund has already been processed (payment_refund_status: ${returnRequest.payment_refund_status}).`,
      );
    }

    await this.ensureSellerWallet(sellerId);

    // When calculated_refund_amount is null (old record), fall back to 0 as baseline.
    // The BUG-28 issue was that null ?? 0 made calculatedAmount = 0, which caused
    // the `calculatedAmount > 0` guard to skip ALL validation — any amount passed.
    // Fix: treat null as "no baseline" by keeping it null for the comparison guard.
    const calculatedAmount = returnRequest.calculated_refund_amount ?? null;
    const actualRefundAmount =
      dto.actual_refund_amount ?? calculatedAmount ?? 0;

    // Validate refund amount is positive
    if (actualRefundAmount <= 0) {
      throw new BadRequestException('Refund amount must be greater than zero');
    }

    // Validate refund amount with stricter rules and audit logging
    if (
      calculatedAmount !== null &&
      actualRefundAmount !== calculatedAmount &&
      calculatedAmount > 0
    ) {
      const difference = actualRefundAmount - calculatedAmount;
      const percentDiff = (difference / calculatedAmount) * 100;

      // Log all manual adjustments for audit trail
      this.logger.warn(`Manual refund adjustment detected`, {
        orderId,
        returnRequestId: returnRequest.id,
        calculatedAmount,
        actualRefundAmount,
        difference,
        percentDiff: percentDiff.toFixed(2),
        userId: user.id,
        reason: dto.refund_notes || 'No reason provided',
        overrideFlag: dto.override_amount || false,
      });

      // Hard limit: never allow more than MAX_REFUND_OVERRIDE_PERCENT over calculated
      const maxAllowedMultiplier = 1 + MAX_REFUND_OVERRIDE_PERCENT / 100;
      if (actualRefundAmount > calculatedAmount * maxAllowedMultiplier) {
        throw new BadRequestException(
          `Refund amount cannot exceed calculated amount by more than ${MAX_REFUND_OVERRIDE_PERCENT}%. ` +
            `Calculated: ${calculatedAmount}, Requested: ${actualRefundAmount}, Max allowed: ${(calculatedAmount * maxAllowedMultiplier).toFixed(2)}`,
        );
      }

      // BUG-29 fix: only require override when refunding MORE than calculated
      // Under-refunding (percentDiff < 0) is acceptable without override
      if (
        percentDiff > REFUND_OVERRIDE_THRESHOLD_PERCENT &&
        !dto.override_amount
      ) {
        throw new BadRequestException(
          `Refund amount exceeds calculated by ${percentDiff.toFixed(2)}%. ` +
            `Set override_amount flag to true and provide refund_notes to proceed.`,
        );
      }

      // Require notes when using override
      if (dto.override_amount && !dto.refund_notes) {
        throw new BadRequestException(
          'refund_notes is required when using override_amount flag',
        );
      }
    }

    // Validate payment before approving refund
    // Get sales order to check payment method
    const salesOrder = await this.salesOrderRepository.findOne({
      where: { id: orderId },
    });

    if (!salesOrder) {
      throw new NotFoundException(`Sales order with ID ${orderId} not found`);
    }

    const isCod = salesOrder.payment_method === 'cod';

    // For non-COD orders, verify payment was completed
    if (!isCod) {
      const payments =
        await this.checkoutPaymentsService.findPaymentsBySalesOrderId(orderId);

      const completedPayment = payments.find(
        (p) =>
          ['maya'].includes(p.payment_gateway ?? '') &&
          [
            CheckoutPaymentStatusEnum.COMPLETED,
            CheckoutPaymentStatusEnum.PARTIALLY_REFUNDED,
          ].includes(p.status as CheckoutPaymentStatusEnum),
      );

      if (!completedPayment) {
        // Non-COD order without completed payment - block refund
        const anyGatewayPayment = payments.find((p) =>
          ['maya'].includes(p.payment_gateway ?? ''),
        );

        throw new BadRequestException(
          `Cannot approve refund for non-COD order. Payment status is ${anyGatewayPayment?.status ?? 'not found'}. ` +
            `Payment must be COMPLETED before refund can be approved.`,
        );
      }
    }
    // COD orders: Allow refund approval regardless of payment records

    // Get return request items to update quantity_returned on sales order items
    const returnItems = await this.returnRequestItemEntityRepository.find({
      where: { return_request_id: returnRequest.id },
    });

    let isFullReturn = false;

    // Refund step only confirms the amount — status stays RECEIVED.
    // refunded_at and item REFUNDED status are set only when payout completes.
    await this.dataSource.transaction(async (manager) => {
      await manager.update(ReturnRequestEntity, returnRequest.id, {
        actual_refund_amount: actualRefundAmount,
        refund_notes: dto.refund_notes || null,
        payment_refund_status: PaymentRefundStatusEnum.PENDING,
        payment_refund_amount: actualRefundAmount,
        updated_by: { id: user.id } as any,
      });

      // Update quantity_returned on each sales order item with overflow guard.
      // The WHERE condition ensures quantity_returned + delta <= quantity atomically.
      for (const returnItem of returnItems) {
        const updateResult = await manager
          .createQueryBuilder()
          .update(SalesOrderItemEntity)
          .set({
            quantity_returned: () =>
              `quantity_returned + ${returnItem.quantity_returning}`,
          })
          .where('id = :id', { id: returnItem.sales_order_item_id })
          .andWhere('quantity_returned + :delta <= quantity', {
            delta: returnItem.quantity_returning,
          })
          .execute();

        if (!updateResult.affected) {
          throw new BadRequestException(
            `Cannot mark item ${returnItem.sales_order_item_id} as returned: quantity_returned would exceed ordered quantity`,
          );
        }
      }

      // Check if this is a full or partial return AFTER updating quantity_returned
      const orderItems = await manager.find(SalesOrderItemEntity, {
        where: { order_id: orderId },
      });

      const totalOrdered = orderItems.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
      const totalReturned = orderItems.reduce(
        (sum, item) => sum + (item.quantity_returned || 0),
        0,
      );

      isFullReturn = totalReturned >= totalOrdered;
      // Order status stays RETURN_REQUESTED until payout completes.
      // Only update the updated_by audit field here.
      await manager.update(SalesOrderEntity, orderId, {
        updated_by: { id: user.id } as any,
      });
    });

    // For COD orders, deduct the refund amount from seller wallet immediately.
    // Non-COD (Maya) orders are deducted via the payout webhook in checkout-payments.service.ts.
    if (isCod && returnRequest.seller_id && actualRefundAmount > 0) {
      await this.walletsService.deductReturn(
        returnRequest.seller_id,
        returnRequest.id,
        actualRefundAmount,
      );
    }

    this.logger.log(`Refund amount confirmed (awaiting payout)`, {
      orderId,
      returnRequestId: returnRequest.id,
      status: ReturnRequestStatusEnum.RECEIVED,
      userId: user.id,
      sellerId,
      calculatedAmount,
      actualRefundAmount,
      isFullReturn,
      itemCount: returnItems.length,
    });

    const returnType = isFullReturn ? 'Full' : 'Partial';
    await this.orderTrackingService.createEvent(
      orderId,
      OrderEventTypeEnum.RETURN_REFUNDED,
      `${returnType} refund confirmed. Amount: ${actualRefundAmount}. Awaiting disbursement.${dto.refund_notes ? ` Notes: ${dto.refund_notes}` : ''}`,
      user,
    );

    const refundedRequest = (await this.returnRequestRepository.findById(
      returnRequest.id,
    )) as ReturnRequest;

    // Notify customer about refund (non-blocking)
    const order = await this.salesOrderRepository.findOne({
      where: { id: orderId },
      relations: ['user', 'seller'],
    });
    if (order?.user) {
      const returnItemsForEmail = refundedRequest.items?.map((item) => ({
        product_name: item.variant?.product?.name,
        variant_name: item.variant?.name,
        image_url:
          item.variant?.product?.image_url ||
          item.variant?.product?.thumbnail_url,
        quantity_returning: item.quantity_returning,
        quantity_ordered: item.quantity_ordered,
        unit_price: item.unit_price,
        return_amount: item.return_amount,
      }));

      this.notificationsService
        .sendRefundProcessed(
          order.user.id,
          refundedRequest.id,
          refundedRequest.return_number,
          actualRefundAmount,
          true,
          order.user.email,
          `${order.user.first_name} ${order.user.last_name}`,
          {
            returnItems: returnItemsForEmail,
            orderNumber: order.order_number,
            sellerName: order.seller?.store_name,
          },
        )
        .catch((error) => {
          this.logger.error(
            'Failed to send refund processed notification:',
            error,
          );
        });
    }

    return refundedRequest;
  }

  /**
   * Process payment payout for a refunded return request (Seller).
   *
   * Dispatches based on dto.refund_method:
   *   - 'cash': marks as completed immediately (manual cash handover)
   *   - 'wallet': reserved for future wallet credit feature
   */
  async processPaymentPayout(
    orderId: number,
    dto: ProcessPayoutDto,
    user: User,
    sellerId: number,
  ): Promise<ReturnRequest> {
    const returnRequest = await this.validateSellerAccess(orderId, sellerId);

    if (
      returnRequest.status !== ReturnRequestStatusEnum.RECEIVED &&
      returnRequest.status !== ReturnRequestStatusEnum.REFUND_PROCESSING &&
      returnRequest.status !== ReturnRequestStatusEnum.REFUND_FAILED
    ) {
      throw new BadRequestException(
        `Payout can only be processed for RECEIVED, REFUND_PROCESSING, or REFUND_FAILED returns. ` +
          `Current status: ${returnRequest.status}`,
      );
    }

    const retryableStatuses = [
      PaymentRefundStatusEnum.PENDING,
      PaymentRefundStatusEnum.FAILED,
      PaymentRefundStatusEnum.PROCESSING,
    ];
    if (
      !retryableStatuses.includes(
        returnRequest.payment_refund_status as PaymentRefundStatusEnum,
      )
    ) {
      throw new BadRequestException(
        `Payment payout cannot be processed. Current payment_refund_status: ${returnRequest.payment_refund_status}`,
      );
    }

    const payoutAmount = returnRequest.actual_refund_amount ?? 0;
    if (payoutAmount <= 0) {
      throw new BadRequestException('Payout amount must be greater than zero');
    }

    const salesOrder = await this.salesOrderRepository.findOne({
      where: { id: orderId },
    });
    const isCod = salesOrder?.payment_method === 'cod';

    switch (dto.refund_method) {
      case PaymentRefundMethodEnum.MAYA:
        await this.processMayaRefund(
          orderId,
          returnRequest,
          payoutAmount,
          dto,
          user,
        );
        break;

      case PaymentRefundMethodEnum.CASH:
        await this.processCashPayout(
          orderId,
          returnRequest,
          payoutAmount,
          dto,
          user,
          isCod,
        );
        break;

      case PaymentRefundMethodEnum.WALLET:
        await this.processWalletRefund(
          orderId,
          returnRequest,
          payoutAmount,
          dto,
          user,
        );
        break;

      default:
        throw new BadRequestException(
          `Unknown refund method: ${dto.refund_method}`,
        );
    }

    return (await this.returnRequestRepository.findById(
      returnRequest.id,
    )) as ReturnRequest;
  }

  /**
   * Wallet refund — refunds back to the customer's original Maya payment source.
   * In mock mode (USE_MOCK_MAYA=true), completes immediately without a real API call.
   * In production, delegates to processMayaRefund.
   */
  private async processWalletRefund(
    orderId: number,
    returnRequest: ReturnRequest,
    payoutAmount: number,
    dto: ProcessPayoutDto,
    user: User,
  ): Promise<void> {
    const useMock =
      this.configService.get<string>('USE_MOCK_MAYA', { infer: true }) ===
      'true';

    if (useMock) {
      this.logger.warn(
        `[MOCK] Wallet refund skipped — USE_MOCK_MAYA=true. returnId=${returnRequest.id} amount=${payoutAmount}`,
      );

      await this.returnRequestEntityRepository.update(returnRequest.id, {
        status: ReturnRequestStatusEnum.REFUNDED,
        payment_refund_status: PaymentRefundStatusEnum.COMPLETED,
        payment_refund_method: PaymentRefundMethodEnum.WALLET,
        payment_refund_amount: payoutAmount,
        payment_refund_by: user.id,
        payment_refund_at: new Date(),
        payment_refund_reference: `MOCK-WALLET-${returnRequest.return_number}`,
        refunded_at: new Date(),
        refunded_by: user.id,
      });

      await this.returnRequestItemEntityRepository.update(
        { return_request_id: returnRequest.id },
        { item_status: ReturnRequestItemStatusEnum.REFUNDED },
      );

      await this.salesOrderRepository.update(orderId, {
        status: OrderStatusEnum.REFUNDED,
        updated_by: { id: user.id } as any,
      });

      if (returnRequest.seller_id && payoutAmount > 0) {
        await this.walletsService.deductReturn(
          returnRequest.seller_id,
          returnRequest.id,
          payoutAmount,
        );
      }

      return;
    }

    // Real mode — refund via Maya gateway
    return this.processMayaRefund(
      orderId,
      returnRequest,
      payoutAmount,
      dto,
      user,
    );
  }

  /**
   * Maya refund — calls Maya Refund API, completes synchronously.
   * Requires MAYA_SECRET_KEY to be configured.
   */
  private async processMayaRefund(
    orderId: number,
    returnRequest: ReturnRequest,
    payoutAmount: number,
    dto: ProcessPayoutDto,
    user: User,
  ): Promise<void> {
    const useMock =
      this.configService.get<string>('USE_MOCK_MAYA', { infer: true }) ===
      'true';

    if (useMock) {
      this.logger.warn(
        `[MOCK] Maya refund skipped — USE_MOCK_MAYA=true. returnId=${returnRequest.id} amount=${payoutAmount}`,
      );

      await this.returnRequestEntityRepository.update(returnRequest.id, {
        status: ReturnRequestStatusEnum.REFUNDED,
        payment_refund_status: PaymentRefundStatusEnum.COMPLETED,
        payment_refund_method: PaymentRefundMethodEnum.MAYA,
        payment_refund_amount: payoutAmount,
        payment_refund_by: user.id,
        payment_refund_at: new Date(),
        payment_refund_reference: `MOCK-MAYA-${returnRequest.return_number}`,
        refunded_at: new Date(),
        refunded_by: user.id,
      });

      await this.returnRequestItemEntityRepository.update(
        { return_request_id: returnRequest.id },
        { item_status: ReturnRequestItemStatusEnum.REFUNDED },
      );

      await this.salesOrderRepository.update(orderId, {
        status: OrderStatusEnum.REFUNDED,
        updated_by: { id: user.id } as any,
      });

      if (returnRequest.seller_id && payoutAmount > 0) {
        await this.walletsService.deductReturn(
          returnRequest.seller_id,
          returnRequest.id,
          payoutAmount,
        );
      }

      return;
    }

    await this.dataSource.transaction(async (manager) => {
      const lockedRequest = await manager.findOne(ReturnRequestEntity, {
        where: { id: returnRequest.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lockedRequest) {
        throw new NotFoundException(
          `Return request with ID ${returnRequest.id} not found`,
        );
      }

      if (
        lockedRequest.status !== ReturnRequestStatusEnum.RECEIVED &&
        lockedRequest.status !== ReturnRequestStatusEnum.REFUND_PROCESSING &&
        lockedRequest.status !== ReturnRequestStatusEnum.REFUND_FAILED
      ) {
        throw new BadRequestException(
          `Payout can only be processed from RECEIVED, REFUND_PROCESSING, or REFUND_FAILED status. ` +
            `Current status: ${lockedRequest.status}`,
        );
      }

      await manager.update(ReturnRequestEntity, returnRequest.id, {
        status: ReturnRequestStatusEnum.REFUND_PROCESSING,
        payment_refund_status: PaymentRefundStatusEnum.PROCESSING,
        payment_refund_method: PaymentRefundMethodEnum.MAYA,
      });
    });

    try {
      const payments =
        await this.checkoutPaymentsService.findPaymentsBySalesOrderId(orderId);

      const completedPayment = payments.find(
        (p) =>
          p.payment_gateway === 'maya' &&
          [
            CheckoutPaymentStatusEnum.COMPLETED,
            CheckoutPaymentStatusEnum.PARTIALLY_REFUNDED,
          ].includes(p.status as CheckoutPaymentStatusEnum),
      );

      if (!completedPayment) {
        throw new BadRequestException(
          'No completed Maya payment found for this order. Cannot process Maya refund.',
        );
      }

      this.logger.log('Maya refund initiated', {
        timestamp: new Date().toISOString(),
        userId: user.id,
        returnRequestId: returnRequest.id,
        returnNumber: returnRequest.return_number,
        orderId,
        payoutAmount,
        originalPaymentId: completedPayment.id,
      });

      const updatedPayment = await this.checkoutPaymentsService.processRefund(
        completedPayment.id,
        payoutAmount,
        dto.notes || `Refund for return ${returnRequest.return_number}`,
        user,
      );

      const refunds = (updatedPayment.gateway_response as any)?.refunds;
      const latestRefund = refunds?.[refunds.length - 1];
      const refundId = latestRefund?.refundId;

      await this.returnRequestEntityRepository.update(returnRequest.id, {
        status: ReturnRequestStatusEnum.REFUNDED,
        payment_refund_status: PaymentRefundStatusEnum.COMPLETED,
        payment_refund_amount: payoutAmount,
        payment_refund_by: user.id,
        payment_refund_at: new Date(),
        payment_refund_reference: refundId || null,
        refunded_at: new Date(),
        refunded_by: user.id,
      });

      await this.returnRequestItemEntityRepository.update(
        { return_request_id: returnRequest.id },
        { item_status: ReturnRequestItemStatusEnum.REFUNDED },
      );

      await this.salesOrderRepository.update(orderId, {
        status: OrderStatusEnum.REFUNDED,
        updated_by: { id: user.id } as any,
      });

      // Deduct refund amount from seller wallet now that Maya refund is confirmed.
      // Mirrors the COD path in processRefund() — no webhook needed since the
      // Maya refund API call above is synchronous and already succeeded.
      if (returnRequest.seller_id && payoutAmount > 0) {
        await this.walletsService.deductReturn(
          returnRequest.seller_id,
          returnRequest.id,
          payoutAmount,
        );
      }

      this.logger.log('Maya refund completed', {
        timestamp: new Date().toISOString(),
        orderId,
        returnRequestId: returnRequest.id,
        payoutAmount,
        refundId,
      });
    } catch (error) {
      await this.returnRequestEntityRepository.update(returnRequest.id, {
        status: ReturnRequestStatusEnum.REFUND_FAILED,
        payment_refund_status: PaymentRefundStatusEnum.FAILED,
      });
      this.logger.error('Maya refund failed', {
        timestamp: new Date().toISOString(),
        orderId,
        returnRequestId: returnRequest.id,
        returnNumber: returnRequest.return_number,
        payoutAmount,
        errorMessage: (error as Error).message,
        errorStack: (error as Error).stack,
        userId: user.id,
      });
      throw new BadRequestException(
        `Maya refund failed: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Cash payout — manual handover, completes immediately.
   */
  private async processCashPayout(
    orderId: number,
    returnRequest: ReturnRequest,
    payoutAmount: number,
    dto: ProcessPayoutDto,
    user: User,
    isCod: boolean,
  ): Promise<void> {
    await this.returnRequestEntityRepository.update(returnRequest.id, {
      status: ReturnRequestStatusEnum.CLOSED,
      payment_refund_status: PaymentRefundStatusEnum.COMPLETED,
      payment_refund_method: PaymentRefundMethodEnum.CASH,
      payment_refund_amount: payoutAmount,
      payment_refund_by: user.id,
      payment_refund_at: new Date(),
      payment_refund_reference: `CASH-${returnRequest.return_number}`,
      refunded_at: new Date(),
      refunded_by: user.id,
    });

    await this.returnRequestItemEntityRepository.update(
      { return_request_id: returnRequest.id },
      { item_status: ReturnRequestItemStatusEnum.REFUNDED },
    );

    await this.salesOrderRepository.update(orderId, {
      status: OrderStatusEnum.REFUNDED,
      updated_by: { id: user.id } as any,
    });

    // Deduct from seller wallet for non-COD orders (COD was already deducted in processRefund).
    // Cash payout means the seller physically hands cash to the customer — the wallet
    // deduction still needs to happen to reconcile the seller's available balance.
    if (!isCod && returnRequest.seller_id && payoutAmount > 0) {
      await this.walletsService.deductReturn(
        returnRequest.seller_id,
        returnRequest.id,
        payoutAmount,
      );
    }

    this.logger.log('Cash payout completed', {
      returnRequestId: returnRequest.id,
      orderId,
      payoutAmount,
      notes: dto.notes,
      userId: user.id,
    });
  }

  /**
   * Get return request by order ID
   */
  async getReturnRequestByOrderId(
    orderId: number,
  ): Promise<ReturnRequest | null> {
    return this.returnRequestRepository.findByOrderId(orderId);
  }

  /**
   * Update payment refund status for a return request
   */
  async updatePaymentRefundStatus(
    returnRequestId: number,
    status: PaymentRefundStatusEnum,
    refundAt?: Date,
  ): Promise<void> {
    const updateData: any = {
      payment_refund_status: status,
    };

    if (refundAt) {
      updateData.payment_refund_at = refundAt;
    }

    await this.returnRequestEntityRepository.update(
      returnRequestId,
      updateData,
    );

    this.logger.log('Updated return request payment refund status', {
      returnRequestId,
      status,
      refundAt,
    });
  }

  /**
   * Get return request by order ID for a specific user (with ownership check)
   * Includes timeline of return-related tracking events
   */
  async getReturnRequestByOrderIdForUser(
    orderId: number,
    userId: number,
  ): Promise<ReturnRequest | null> {
    const returnRequest =
      await this.returnRequestRepository.findByOrderId(orderId);

    if (!returnRequest) {
      return null;
    }

    if (returnRequest.user_id !== userId) {
      throw new ForbiddenException(
        'You do not have access to this return request',
      );
    }

    // Get return-related tracking events for timeline
    const allEvents =
      await this.orderTrackingService.getEventsByOrderId(orderId);

    // Filter to only return-related events
    const returnEventTypes = [
      OrderEventTypeEnum.RETURN_REQUESTED,
      OrderEventTypeEnum.RETURN_APPROVED,
      OrderEventTypeEnum.RETURN_REJECTED,
      OrderEventTypeEnum.RETURN_PICKUP_SCHEDULED,
      OrderEventTypeEnum.RETURN_PICKED_UP,
      OrderEventTypeEnum.RETURN_RECEIVED,
      OrderEventTypeEnum.RETURN_REFUNDED,
      OrderEventTypeEnum.RETURN_CLOSED,
      OrderEventTypeEnum.REFUND_PROCESSED,
    ];

    returnRequest.timeline = allEvents.filter((event) =>
      returnEventTypes.includes(event.event_type),
    );

    return returnRequest;
  }

  /**
   * Get return request by order ID for a specific seller (with ownership check)
   */
  async getReturnRequestByOrderIdForSeller(
    orderId: number,
    sellerId: number,
  ): Promise<ReturnRequest | null> {
    const returnRequest =
      await this.returnRequestRepository.findByOrderId(orderId);

    if (!returnRequest) {
      return null;
    }

    if (returnRequest.seller_id !== sellerId) {
      throw new ForbiddenException(
        'You do not have access to this return request',
      );
    }

    return returnRequest;
  }

  /**
   * Get return requests for seller with pagination
   */
  async getReturnRequestsForSeller(
    query: QueryReturnRequestDto,
    sellerId: number,
  ): Promise<PaginatedReturnRequests> {
    return this.returnRequestRepository.findBySellerId(sellerId, {
      page: query.page,
      limit: query.limit,
      status: query.status,
      sort_by: query.sort_by,
      sort_order: query.sort_order,
    });
  }

  /**
   * Get return requests for customer with pagination
   */
  async getReturnRequestsForUser(
    query: QueryReturnRequestDto,
    userId: number,
  ): Promise<PaginatedReturnRequests> {
    return this.returnRequestRepository.findByUserId(userId, {
      page: query.page,
      limit: query.limit,
      status: query.status,
      sort_by: query.sort_by,
      sort_order: query.sort_order,
    });
  }

  /**
   * Get return requests for seller with DevExtreme query support
   */
  async getReturnRequestsForSellerDevExtreme(
    query: QueryReturnRequestDevExtremeDto,
    sellerId: number | null,
  ): Promise<DevExtremePaginatedResponseDto<ReturnRequest>> {
    return this.returnRequestRepository.findBySellerIdDevExtreme(
      sellerId,
      query,
    );
  }

  /**
   * Ensure a seller wallet exists. Called on every return status transition so
   * wallets are created lazily for sellers who registered before wallet feature.
   */
  private async ensureSellerWallet(sellerId: number): Promise<void> {
    const row = await this.dataSource
      .getRepository('sellers')
      .createQueryBuilder('s')
      .select('s.user_id')
      .where('s.id = :sellerId', { sellerId })
      .getRawOne<{ s_user_id: number }>();
    if (row?.s_user_id) {
      await this.walletsService.ensureSellerWallet(row.s_user_id, sellerId);
    }
  }

  /**
   * Validate seller has access to the return request
   */
  private async validateSellerAccess(
    orderId: number,
    sellerId: number,
  ): Promise<ReturnRequest> {
    const returnRequest =
      await this.returnRequestRepository.findByOrderId(orderId);

    if (!returnRequest) {
      throw new NotFoundException(
        `No return request found for order ID ${orderId}`,
      );
    }

    if (returnRequest.seller_id !== sellerId) {
      throw new ForbiddenException(
        'You do not have access to this return request',
      );
    }

    return returnRequest;
  }

  /**
   * Validate return window - check if order is within allowed return period
   */
  private validateReturnWindow(order: SalesOrderEntity): void {
    // Get return window from .env, default to 7 days
    const returnWindowDays = this.configService.get<number>(
      'RETURN_WINDOW_DAYS',
      DEFAULT_RETURN_WINDOW_DAYS,
      {
        infer: true,
      },
    );

    // If return window is 0 or negative, no time limit is enforced
    if (returnWindowDays <= 0) {
      return;
    }

    // Use delivered_at or updated_at as the reference date
    const deliveredAt = order.delivered_at || order.updated_at;
    if (!deliveredAt) {
      throw new BadRequestException(
        'Cannot determine delivery date for return window validation',
      );
    }

    const returnDeadline = new Date(deliveredAt);
    returnDeadline.setDate(returnDeadline.getDate() + returnWindowDays);

    if (new Date() > returnDeadline) {
      throw new BadRequestException(
        `Return window has expired. Returns must be requested within ${returnWindowDays} days of delivery. Delivery date: ${deliveredAt.toISOString().split('T')[0]}`,
      );
    }
  }

  /**
   * Generate unique return number
   * Format: RR-{timestamp base36}-{random}
   * Example: RR-M5K8P2Q3-A7B9
   */
  private generateReturnNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RR-${timestamp}-${random}`;
  }

  /**
   * Check if error is a return number collision
   */
  private isReturnNumberCollision(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('duplicate key') && message.includes('return_number')
      );
    }
    return false;
  }
}
