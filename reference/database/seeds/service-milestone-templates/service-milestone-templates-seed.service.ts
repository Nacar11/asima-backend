import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISeedService } from '../seed.interface';
import { ServiceMilestoneTemplateEntity } from '@/service-milestone-templates/persistence/entities/service-milestone-template.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Service for seeding service milestone templates
 */
@Injectable()
export class ServiceMilestoneTemplatesSeedService implements ISeedService {
  constructor(
    @InjectRepository(ServiceMilestoneTemplateEntity)
    private repository: Repository<ServiceMilestoneTemplateEntity>,
    @InjectRepository(ServiceEntity)
    private serviceRepository: Repository<ServiceEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    const count = await this.repository.count();

    if (!count) {
      const user = await this.userRepository.findOne({
        where: {
          id: 1,
        },
      });

      if (!user) {
        console.error(
          '❌ No user found. Cannot proceed to seed service milestone templates.',
        );
        return;
      }

      const services = await this.serviceRepository.find({ take: 2 });

      if (services.length === 0) {
        console.log(
          '⚠️  No services found. Skipping service milestone templates seed.',
        );
        return;
      }

      const templates: Array<{
        service_id: number;
        package_id: number | null;
        name: string;
        description: string;
        sequence_order: number;
        payment_percent: number;
        requires_customer_approval: boolean;
        auto_approve_after_hours: number;
        is_active: boolean;
        created_by: UserEntity;
        updated_by: UserEntity;
      }> = [];

      for (const service of services) {
        templates.push({
          service_id: service.id,
          package_id: null,
          name: 'Initial Consultation',
          description: 'Initial consultation and planning',
          sequence_order: 1,
          payment_percent: 30.0,
          requires_customer_approval: true,
          auto_approve_after_hours: 48,
          is_active: true,
          created_by: user,
          updated_by: user,
        });
        templates.push({
          service_id: service.id,
          package_id: null,
          name: 'Service Delivery',
          description: 'Main service delivery',
          sequence_order: 2,
          payment_percent: 50.0,
          requires_customer_approval: true,
          auto_approve_after_hours: 48,
          is_active: true,
          created_by: user,
          updated_by: user,
        });
        templates.push({
          service_id: service.id,
          package_id: null,
          name: 'Completion',
          description: 'Final completion and review',
          sequence_order: 3,
          payment_percent: 20.0,
          requires_customer_approval: true,
          auto_approve_after_hours: 48,
          is_active: true,
          created_by: user,
          updated_by: user,
        });
      }

      await this.repository.save(
        templates.map((template) => this.repository.create(template)),
      );

      console.log(
        `✅ ${templates.length} service milestone templates seeded successfully`,
      );
    }
  }
}
