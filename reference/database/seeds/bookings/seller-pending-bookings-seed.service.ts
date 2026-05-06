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
 * Service for seeding seller bookings with pending status
 *
 * This seeder creates bookings specifically for sellers with "pending" status
 * to test the seller-bookings endpoint: /api/v1/bookings/seller-bookings?page=1&limit=20&status=pending
 */
@Injectable()
export class SellerPendingBookingsSeedService implements ISeedService {
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
    // Check if there are already pending bookings for sellers
    const existingPendingCount = await this.repository.count({
      where: { status: BookingStatusEnum.PENDING },
    });

    // Create at least 20 pending bookings for sellers if we don't have enough
    const targetCount = 20;

    if (existingPendingCount >= targetCount) {
      console.log(
        `⚠️  Already have ${existingPendingCount} pending bookings. Skipping seller pending bookings seed.`,
      );
      return;
    }

    // Fetch required related entities
    const checkoutOrders = await this.checkoutOrderRepository.find({
      take: 30,
    });
    const services = await this.serviceRepository.find({ take: 30 });
    const users = await this.userRepository.find({ take: 20 });
    const sellers = await this.sellerRepository.find({ take: 10 });
    const sellerMembers = await this.sellerMemberRepository.find({
      take: 20,
    });
    const userAddresses = await this.userAddressRepository.find({ take: 20 });

    if (
      checkoutOrders.length === 0 ||
      services.length === 0 ||
      users.length === 0 ||
      sellers.length === 0
    ) {
      console.log(
        '⚠️  Insufficient related data found. Need checkout orders, services, users, and sellers. Skipping seller pending bookings seed.',
      );
      return;
    }

    // Get a user for customer bookings (use user ID 2 if available, otherwise first user)
    const customerUser =
      (await this.userRepository.findOne({ where: { id: 2 } })) || users[0];

    if (!customerUser) {
      console.log('⚠️  No users found. Cannot seed seller pending bookings.');
      return;
    }

    const bookings: Partial<BookingEntity>[] = [];
    const today = new Date();
    const bookingsToCreate = targetCount - existingPendingCount;

    // Create pending bookings distributed across different sellers
    for (let i = 0; i < bookingsToCreate; i++) {
      const checkoutOrder = faker.helpers.arrayElement(checkoutOrders);

      // Select a seller and ensure we use a service from that seller
      const seller = faker.helpers.arrayElement(sellers);
      const sellerServices = services.filter((s) => s.seller_id === seller.id);
      const service =
        sellerServices.length > 0
          ? faker.helpers.arrayElement(sellerServices)
          : faker.helpers.arrayElement(services);

      // Use a different customer for variety (but ensure valid user)
      const customer =
        i % 3 === 0 && users.length > 1
          ? faker.helpers.arrayElement(
              users.filter((u) => u.id !== seller.user_id),
            )
          : customerUser;

      const assignedMember = faker.helpers.maybe(
        () =>
          sellerMembers.length > 0 &&
          sellerMembers.some((m) => m.seller_id === seller.id)
            ? faker.helpers.arrayElement(
                sellerMembers.filter((m) => m.seller_id === seller.id),
              )
            : null,
        { probability: 0.5 },
      );

      const serviceAddress = faker.helpers.maybe(
        () =>
          userAddresses.length > 0
            ? faker.helpers.arrayElement(userAddresses)
            : null,
        { probability: 0.6 },
      );

      // Generate realistic scheduled date (future dates for pending bookings)
      const scheduledDate = new Date(
        today.getTime() +
          faker.number.int({ min: 1, max: 30 }) * 24 * 60 * 60 * 1000,
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

      // Generate unique booking number
      const timestamp = Date.now();
      const bookingNumber = `BK-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}-${(timestamp + i).toString().slice(-4)}`;

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

      const booking = {
        checkout_order_id: checkoutOrder.id,
        seller_id: seller.id, // Ensure booking belongs to a seller
        service_id: service.id,
        package_id: null,
        bundle_id: null,
        booking_number: bookingNumber,
        assigned_member_id: assignedMember?.id || null,
        customer_id: customer.id,
        scheduled_date: scheduledDate,
        scheduled_start_time: scheduledStartTime,
        scheduled_end_time: scheduledEndTime,
        actual_start_time: null, // Pending bookings don't have actual times
        actual_end_time: null,
        service_address_id: serviceAddress?.id || null,
        service_address_text: serviceAddress
          ? null
          : faker.location.streetAddress(),
        service_latitude: serviceAddress?.latitude || faker.location.latitude(),
        service_longitude:
          serviceAddress?.longitude || faker.location.longitude(),
        subtotal: subtotal,
        discount_amount: discountAmount,
        platform_fee: platformFee,
        platform_fee_percent: platformFeePercent,
        provider_payout: providerPayout,
        total: total,
        status: BookingStatusEnum.PENDING, // Always pending
        customer_notes: faker.helpers.maybe(() => faker.lorem.sentence(), {
          probability: 0.4,
        }),
        provider_notes: null, // Pending bookings typically don't have provider notes yet
        internal_notes: faker.helpers.maybe(() => faker.lorem.sentence(), {
          probability: 0.2,
        }),
        cancelled_at: null, // Not cancelled
        cancelled_by: null,
        cancellation_reason: null,
        completed_at: null, // Not completed
        confirmed_at: null, // Not confirmed yet (pending status)
        created_by: customer,
        updated_by: customer,
      };

      bookings.push(booking);
    }

    if (bookings.length > 0) {
      await this.repository.save(bookings);
      console.log(
        `✅ ${bookings.length} seller pending bookings seeded successfully`,
      );
    } else {
      console.log('⚠️  No bookings to seed');
    }
  }
}
