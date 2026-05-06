import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ISeedService } from '../seed.interface';
import { Repository } from 'typeorm';
import { BookingMilestoneEntity } from '@/booking-milestones/persistence/entities/booking-milestone.entity';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { ServiceMilestoneTemplateEntity } from '@/service-milestone-templates/persistence/entities/service-milestone-template.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { MilestoneStatusEnum } from '@/booking-milestones/enums/milestone-status.enum';
import { ServiceMilestoneTemplateStatusEnum } from '@/service-milestone-templates/enums/service-milestone-template-status.enum';
import { faker } from '@faker-js/faker';

/**
 * Service for seeding booking milestones
 */
@Injectable()
export class BookingMilestonesSeedService implements ISeedService {
  constructor(
    @InjectRepository(BookingMilestoneEntity)
    private repository: Repository<BookingMilestoneEntity>,
    @InjectRepository(BookingEntity)
    private bookingRepository: Repository<BookingEntity>,
    @InjectRepository(ServiceMilestoneTemplateEntity)
    private templateRepository: Repository<ServiceMilestoneTemplateEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    const count = await this.repository.count();

    if (!count) {
      // Fetch bookings that don't already have milestones
      const bookings = await this.bookingRepository
        .createQueryBuilder('booking')
        .leftJoinAndSelect('booking.service', 'service')
        .leftJoin(
          'booking_milestones',
          'milestones',
          'milestones.booking_id = booking.id',
        )
        .where('milestones.id IS NULL')
        .take(20)
        .getMany();

      if (bookings.length === 0) {
        console.log(
          '⚠️  No bookings found or all bookings already have milestones. Skipping booking milestones seed.',
        );
        return;
      }

      // Fetch users for approval assignments
      const users = await this.userRepository.find({ take: 5 });

      if (users.length === 0) {
        console.log('⚠️  No users found. Skipping booking milestones seed.');
        return;
      }

      const allMilestones: Partial<BookingMilestoneEntity>[] = [];

      for (const booking of bookings) {
        // Check if service has milestone templates
        const templates = await this.templateRepository.find({
          where: {
            service_id: booking.service_id,
            status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
          },
          order: { sequence_order: 'ASC' },
        });

        let milestonesToCreate: Array<{
          name: string;
          description: string | null;
          sequence_order: number;
          payment_percent: number;
          template_id: number | null;
          auto_approve_after_hours: number;
        }> = [];

        if (templates.length > 0) {
          // Use templates from service
          milestonesToCreate = templates.map((template) => ({
            name: template.name,
            description: template.description,
            sequence_order: template.sequence_order,
            payment_percent: Number(template.payment_percent),
            template_id: template.id,
            auto_approve_after_hours: template.auto_approve_after_hours,
          }));
        } else {
          // Create default milestones
          milestonesToCreate = [
            {
              name: 'Initial Consultation',
              description: 'Initial consultation and planning phase',
              sequence_order: 1,
              payment_percent: 30.0,
              template_id: null,
              auto_approve_after_hours: 48,
            },
            {
              name: 'Service Delivery',
              description: 'Main service execution and delivery',
              sequence_order: 2,
              payment_percent: 50.0,
              template_id: null,
              auto_approve_after_hours: 48,
            },
            {
              name: 'Completion & Review',
              description: 'Final completion and quality review',
              sequence_order: 3,
              payment_percent: 20.0,
              template_id: null,
              auto_approve_after_hours: 48,
            },
          ];
        }

        // Calculate payment amounts and create milestones
        const bookingTotal = Number(booking.total);
        const scheduledDate = new Date(booking.scheduled_date);
        const now = new Date();

        // Determine overall booking progress (0-100%) for realistic milestone progression
        // This creates diverse scenarios: some bookings are new, some in progress, some complete
        const bookingProgress = faker.number.float({ min: 0, max: 1 });
        const isPastBooking = scheduledDate <= now;

        // Track previous milestone status for sequence validation
        const milestoneStatuses: MilestoneStatusEnum[] = [];

        for (let index = 0; index < milestonesToCreate.length; index++) {
          const milestoneData = milestonesToCreate[index];
          const paymentAmount =
            (bookingTotal * milestoneData.payment_percent) / 100;

          // Determine status based on sequence validation and booking progress
          let status = MilestoneStatusEnum.PENDING;
          let started_at: Date | null = null;
          let completed_at: Date | null = null;
          let approved_at: Date | null = null;
          let approved_by: number | null = null;
          let payment_released = false;
          let payment_released_at: Date | null = null;
          let submitted_at: Date | null = null;

          // Check if previous milestone is approved (sequence validation)
          const previousMilestoneApproved =
            index === 0 ||
            milestoneStatuses[index - 1] === MilestoneStatusEnum.APPROVED;

          // Only progress milestone if previous one is approved (or it's the first milestone)
          if (previousMilestoneApproved) {
            // Calculate progress threshold for this milestone
            // Each milestone gets a portion of the overall progress
            const milestoneProgressThreshold =
              index / milestonesToCreate.length;
            const nextMilestoneProgressThreshold =
              (index + 1) / milestonesToCreate.length;

            // Determine status based on booking progress and milestone position
            if (bookingProgress >= nextMilestoneProgressThreshold) {
              // This milestone should be APPROVED
              status = MilestoneStatusEnum.APPROVED;
              if (isPastBooking) {
                // Set realistic dates for approved milestone
                // Calculate base date considering previous milestones
                const baseDate =
                  index === 0
                    ? scheduledDate
                    : new Date(
                        scheduledDate.getTime() +
                          index * 7 * 24 * 60 * 60 * 1000,
                      );

                // Set dates in logical order: started < completed < approved
                started_at = faker.date.between({
                  from: baseDate,
                  to: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000),
                });
                completed_at = started_at
                  ? faker.date.between({
                      from: started_at,
                      to: new Date(
                        started_at.getTime() + 3 * 24 * 60 * 60 * 1000,
                      ),
                    })
                  : null;
                submitted_at = completed_at || started_at;
                approved_at = completed_at
                  ? faker.date.between({
                      from: completed_at,
                      to: new Date(
                        completed_at.getTime() + 1 * 24 * 60 * 60 * 1000,
                      ),
                    })
                  : submitted_at || started_at;

                // Set approval and payment details for APPROVED status
                approved_by = faker.helpers.arrayElement(users).id;
                payment_released = true;
                payment_released_at = approved_at;
              }
            } else if (bookingProgress >= milestoneProgressThreshold) {
              // This milestone is in progress (between thresholds)
              const progressInRange =
                (bookingProgress - milestoneProgressThreshold) /
                (nextMilestoneProgressThreshold - milestoneProgressThreshold);

              if (progressInRange > 0.6) {
                // Submitted (waiting for approval)
                status = MilestoneStatusEnum.SUBMITTED;
                if (isPastBooking) {
                  const baseDate =
                    index === 0
                      ? scheduledDate
                      : new Date(
                          scheduledDate.getTime() +
                            index * 7 * 24 * 60 * 60 * 1000,
                        );
                  // Set dates: started < completed = submitted
                  started_at = faker.date.between({
                    from: baseDate,
                    to: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000),
                  });
                  completed_at = started_at
                    ? faker.date.between({
                        from: started_at,
                        to: new Date(
                          started_at.getTime() + 3 * 24 * 60 * 60 * 1000,
                        ),
                      })
                    : null;
                  submitted_at = completed_at || started_at || new Date();
                  // approved_at remains null for SUBMITTED status
                }
              } else if (progressInRange > 0.2) {
                // In progress
                status = MilestoneStatusEnum.IN_PROGRESS;
                if (isPastBooking) {
                  const baseDate =
                    index === 0
                      ? scheduledDate
                      : new Date(
                          scheduledDate.getTime() +
                            index * 7 * 24 * 60 * 60 * 1000,
                        );
                  // Only set started_at for IN_PROGRESS status
                  started_at = faker.date.between({
                    from: baseDate,
                    to: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000),
                  });
                  // completed_at, submitted_at, approved_at remain null for IN_PROGRESS
                }
              }
              // else: pending (progressInRange <= 0.2)
              // All dates remain null for PENDING status
            }
            // else: pending (bookingProgress < milestoneProgressThreshold)
            // All dates remain null for PENDING status
          }
          // else: pending (previous milestone not approved)
          // All dates remain null when previous milestone is not approved

          // Store status for next iteration
          milestoneStatuses.push(status);

          const milestone: Partial<BookingMilestoneEntity> = {
            booking_id: booking.id,
            template_id: milestoneData.template_id,
            name: milestoneData.name,
            description: milestoneData.description,
            sequence_order: milestoneData.sequence_order,
            status: status,
            started_at: started_at,
            completed_at: completed_at,
            approved_at: approved_at,
            payment_percent: milestoneData.payment_percent,
            payment_amount: paymentAmount,
            payment_released: payment_released,
            payment_released_at: payment_released_at,
            customer_notes: faker.helpers.maybe(() => faker.lorem.sentence(), {
              probability: 0.3,
            }),
            rejection_reason: null,
            provider_notes: faker.helpers.maybe(() => faker.lorem.sentence(), {
              probability: 0.3,
            }),
            approved_by: approved_by,
            auto_approved: false,
            submitted_at: submitted_at,
            auto_approve_after_hours: milestoneData.auto_approve_after_hours,
            created_by: faker.helpers.arrayElement(users),
            updated_by: faker.helpers.arrayElement(users),
          };

          allMilestones.push(milestone);
        }
      }

      await this.repository.save(allMilestones);

      console.log(
        `✅ ${allMilestones.length} booking milestones seeded successfully for ${bookings.length} bookings`,
      );
    }
  }
}
