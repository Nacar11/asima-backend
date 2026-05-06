import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ISeedService } from '../seed.interface';
import { Repository } from 'typeorm';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { CheckoutOrderEntity } from '@/checkout-orders/persistence/entities/checkout-order.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { SellerMemberEntity } from '@/seller-members/persistence/entities/seller-member.entity';
import { UserAddressEntity } from '@/user-addresses/persistence/entities/user-address.entity';
import { BookingStatusEnum } from '@/bookings/enums/booking-status.enum';
import { faker } from '@faker-js/faker';

/**
 * Service for seeding bookings
 */
@Injectable()
export class BookingsSeedService implements ISeedService {
  constructor(
    @InjectRepository(BookingEntity)
    private repository: Repository<BookingEntity>,
    @InjectRepository(CheckoutOrderEntity)
    private checkoutOrderRepository: Repository<CheckoutOrderEntity>,
    @InjectRepository(ServiceEntity)
    private serviceRepository: Repository<ServiceEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(SellerEntity)
    private sellerRepository: Repository<SellerEntity>,
    @InjectRepository(SellerMemberEntity)
    private sellerMemberRepository: Repository<SellerMemberEntity>,
    @InjectRepository(UserAddressEntity)
    private userAddressRepository: Repository<UserAddressEntity>,
  ) {}

  async run(): Promise<void> {
    const count = await this.repository.count();

    if (!count) {
      // Fetch required related entities
      const checkoutOrders = await this.checkoutOrderRepository.find({
        take: 5,
      });
      const services = await this.serviceRepository.find({ take: 5 });
      const users = await this.userRepository.find({ take: 10 });
      const sellers = await this.sellerRepository.find({ take: 5 });
      const sellerMembers = await this.sellerMemberRepository.find({
        take: 10,
      });
      const userAddresses = await this.userAddressRepository.find({ take: 10 });

      if (
        checkoutOrders.length === 0 ||
        services.length === 0 ||
        users.length === 0 ||
        sellers.length === 0
      ) {
        console.log(
          '⚠️  Insufficient related data found. Need checkout orders, services, users, and sellers. Skipping bookings seed.',
        );
        return;
      }

      // Get user with ID 2 for all bookings
      const customerUser = await this.userRepository.findOne({
        where: { id: 2 },
      });

      if (!customerUser) {
        console.log('⚠️  User with ID 2 not found. Skipping bookings seed.');
        return;
      }

      const bookings: Partial<BookingEntity>[] = [];
      const today = new Date();

      // Create 20 booking records
      for (let i = 0; i < 20; i++) {
        const checkoutOrder = faker.helpers.arrayElement(checkoutOrders);
        const service = faker.helpers.arrayElement(services);

        // All bookings belong to customer_id = 2
        const customer: UserEntity = customerUser;

        const seller =
          sellers.find((s) => s.id === service.seller_id) ||
          faker.helpers.arrayElement(sellers);
        const assignedMember = faker.helpers.maybe(
          () =>
            sellerMembers.length > 0
              ? faker.helpers.arrayElement(sellerMembers)
              : null,
          { probability: 0.7 },
        );
        const serviceAddress = faker.helpers.maybe(
          () =>
            userAddresses.length > 0
              ? faker.helpers.arrayElement(userAddresses)
              : null,
          { probability: 0.6 },
        );

        // Generate realistic scheduled date (today to 30 days in the future)
        const scheduledDate = new Date(
          today.getTime() +
            faker.number.int({ min: 0, max: 30 }) * 24 * 60 * 60 * 1000,
        );

        // Generate realistic time slots
        const startHour = faker.number.int({ min: 8, max: 17 }); // 8 AM to 5 PM
        const scheduledStartTime = `${startHour.toString().padStart(2, '0')}:${faker.helpers.arrayElement(['00', '15', '30', '45'])}:00`;

        const duration =
          service.estimated_duration_minutes ||
          faker.number.int({ min: 60, max: 480 });
        const endHour = startHour + Math.floor(duration / 60);
        const endMinute =
          (parseInt(scheduledStartTime.split(':')[1]) + (duration % 60)) % 60;
        const scheduledEndTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}:00`;

        // Generate booking number
        const bookingNumber = `BK-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}-${(i + 1).toString().padStart(4, '0')}`;

        // Pricing calculations
        const subtotal = faker.number.float({
          min: 500,
          max: 10000,
          fractionDigits: 2,
        });
        const discountAmount = faker.number.float({
          min: 0,
          max: subtotal * 0.2,
          fractionDigits: 2,
        });
        const platformFeePercent = 0.0;
        const platformFee =
          (subtotal - discountAmount) * (platformFeePercent / 100);
        const total = subtotal - discountAmount;
        const providerPayout = total - platformFee;

        // Determine status based on scheduled date
        let status = BookingStatusEnum.PENDING;
        const daysFromNow = Math.floor(
          (scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysFromNow < 0) {
          // Past booking
          const statusOptions = [
            BookingStatusEnum.COMPLETED,
            BookingStatusEnum.CANCELLED,
            BookingStatusEnum.PENDING_REVIEW,
          ];
          status = faker.helpers.arrayElement(statusOptions);
        } else if (daysFromNow === 0) {
          // Today
          const statusOptions = [
            BookingStatusEnum.CONFIRMED,
            BookingStatusEnum.IN_PROGRESS,
            BookingStatusEnum.PENDING,
          ];
          status = faker.helpers.arrayElement(statusOptions);
        } else {
          // Future
          const statusOptions = [
            BookingStatusEnum.PENDING,
            BookingStatusEnum.CONFIRMED,
            BookingStatusEnum.PROVIDER_ASSIGNED,
          ];
          status = faker.helpers.arrayElement(statusOptions);
        }

        const booking = {
          checkout_order_id: checkoutOrder.id,
          seller_id: seller.id,
          service_id: service.id,
          package_id: null, // No packages for simplicity
          bundle_id: null, // No bundles for simplicity
          booking_number: bookingNumber,
          assigned_member_id: assignedMember?.id || null,
          customer_id: customer.id,
          scheduled_date: scheduledDate,
          scheduled_start_time: scheduledStartTime,
          scheduled_end_time: scheduledEndTime,
          actual_start_time:
            status === BookingStatusEnum.IN_PROGRESS ||
            status === BookingStatusEnum.COMPLETED ||
            status === BookingStatusEnum.PENDING_REVIEW
              ? new Date(
                  scheduledDate.getTime() +
                    faker.number.int({ min: -30, max: 30 }) * 60000,
                ) // +/- 30 minutes
              : null,
          actual_end_time:
            status === BookingStatusEnum.COMPLETED ||
            status === BookingStatusEnum.PENDING_REVIEW
              ? new Date(
                  scheduledDate.getTime() +
                    duration * 60000 +
                    faker.number.int({ min: -30, max: 30 }) * 60000,
                )
              : null,
          service_address_id: serviceAddress?.id || null,
          service_address_text: serviceAddress
            ? null
            : faker.location.streetAddress(),
          service_latitude:
            serviceAddress?.latitude || faker.location.latitude(),
          service_longitude:
            serviceAddress?.longitude || faker.location.longitude(),
          subtotal: subtotal,
          discount_amount: discountAmount,
          platform_fee: platformFee,
          platform_fee_percent: platformFeePercent,
          provider_payout: providerPayout,
          total: total,
          status: status,
          customer_notes: faker.helpers.maybe(() => faker.lorem.sentence(), {
            probability: 0.4,
          }),
          provider_notes: faker.helpers.maybe(() => faker.lorem.sentence(), {
            probability: 0.3,
          }),
          internal_notes: faker.helpers.maybe(() => faker.lorem.sentence(), {
            probability: 0.2,
          }),
          cancelled_at:
            status === BookingStatusEnum.CANCELLED
              ? faker.date.recent({ days: 7 })
              : null,
          cancelled_by:
            status === BookingStatusEnum.CANCELLED
              ? faker.helpers.arrayElement(users).id
              : null,
          cancellation_reason:
            status === BookingStatusEnum.CANCELLED
              ? faker.helpers.arrayElement([
                  'Customer requested cancellation',
                  'Provider unavailable',
                  'Schedule conflict',
                  'Emergency situation',
                ])
              : null,
          completed_at:
            status === BookingStatusEnum.COMPLETED ||
            status === BookingStatusEnum.PENDING_REVIEW
              ? faker.date.recent({ days: 7 })
              : null,
          confirmed_at: [
            BookingStatusEnum.CONFIRMED,
            BookingStatusEnum.PROVIDER_ASSIGNED,
            BookingStatusEnum.IN_PROGRESS,
            BookingStatusEnum.COMPLETED,
            BookingStatusEnum.PENDING_REVIEW,
          ].includes(status)
            ? faker.date.recent({ days: 14 })
            : null,
          created_by: customer,
          updated_by: customer,
        };

        bookings.push(booking);
      }

      await this.repository.save(bookings);

      console.log(`✅ ${bookings.length} bookings seeded successfully`);
    }
  }
}
