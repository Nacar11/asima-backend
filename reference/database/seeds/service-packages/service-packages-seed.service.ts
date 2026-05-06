import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISeedService } from '../seed.interface';
import { ServicePackageEntity } from '@/service-packages/persistence/entities/service-package.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ServicePackageStatusEnum } from '@/service-packages/enums/service-package-status.enum';

/**
 * Service for seeding service packages
 */
@Injectable()
export class ServicePackagesSeedService implements ISeedService {
  constructor(
    @InjectRepository(ServicePackageEntity)
    private repository: Repository<ServicePackageEntity>,
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
          '❌ No user found. Cannot proceed to seed service packages.',
        );
        return;
      }

      const services = await this.serviceRepository.find({ take: 2 });

      if (services.length === 0) {
        console.log('⚠️  No services found. Skipping service packages seed.');
        return;
      }

      const packages: Array<{
        service_id: number;
        name: string;
        description: string;
        price: number;
        duration_minutes: number;
        status: ServicePackageStatusEnum;
        is_popular: boolean;
        display_order: number;
        created_by: UserEntity;
        updated_by: UserEntity;
      }> = [];

      for (const service of services) {
        packages.push({
          service_id: service.id,
          name: 'Basic Package',
          description: 'Basic service package',
          price: 1000.0,
          duration_minutes: 60,
          status: ServicePackageStatusEnum.ACTIVE,
          is_popular: false,
          display_order: 0,
          created_by: user,
          updated_by: user,
        });
      }

      await this.repository.save(
        packages.map((pkg) => this.repository.create(pkg)),
      );

      console.log(`✅ ${packages.length} service packages seeded successfully`);
    }
  }
}
