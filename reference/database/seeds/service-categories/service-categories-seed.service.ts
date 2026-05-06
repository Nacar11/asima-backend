import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceCategoryEntity } from '@/service-categories/persistence/entities/service-category.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ISeedService } from '../seed.interface';

/**
 * Service for seeding service categories.
 *
 * Categories are designed for a multi-use establishment (sports, automotive,
 * personal care, health & wellness) rather than the old MEPF layout.
 */
@Injectable()
export class ServiceCategoriesSeedService implements ISeedService {
  constructor(
    @InjectRepository(ServiceCategoryEntity)
    private repository: Repository<ServiceCategoryEntity>,
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
          '❌ No user found. Cannot proceed to seed service categories.',
        );
        return;
      }

      // Parent Service Categories
      const parentCategories = [
        {
          name: 'Sports & Recreation',
          code: 'sports-recreation',
          description: 'Sports facilities, courts, and recreational activities',
          level: 0,
          display_order: 1,
          is_active: true,
          is_featured: true,
          default_platform_fee_percent: 10.0,
          icon_url: '/assets/images/travajo/Fitness.png',
          image_url: '/assets/images/travajo/Fitness.png',
          created_by: user,
          updated_by: user,
        },
        {
          name: 'Automotive',
          code: 'automotive',
          description: 'Car wash, detailing, and automotive services',
          level: 0,
          display_order: 2,
          is_active: true,
          is_featured: true,
          default_platform_fee_percent: 10.0,
          icon_url: '/assets/images/travajo/CarServices.png',
          image_url: '/assets/images/travajo/CarServices.png',
          created_by: user,
          updated_by: user,
        },
        {
          name: 'Personal Care',
          code: 'personal-care',
          description: 'Barbershop, nail salon, massage, and grooming services',
          level: 0,
          display_order: 3,
          is_active: true,
          is_featured: true,
          default_platform_fee_percent: 10.0,
          icon_url: '/assets/images/travajo/PersonalCare.png',
          image_url: '/assets/images/travajo/PersonalCare.png',
          created_by: user,
          updated_by: user,
        },
        {
          name: 'Health & Wellness',
          code: 'health-wellness',
          description:
            'Wellness packages, fitness training, and health services',
          level: 0,
          display_order: 4,
          is_active: true,
          is_featured: true,
          default_platform_fee_percent: 10.0,
          icon_url: '/assets/images/travajo/Fitness.png',
          image_url: '/assets/images/travajo/Fitness.png',
          created_by: user,
          updated_by: user,
        },
      ];

      // Save parent categories and track their IDs
      const savedCategories: Record<string, ServiceCategoryEntity> = {};
      for (const category of parentCategories) {
        const saved = await this.repository.save(
          this.repository.create(category),
        );
        savedCategories[category.code] = saved;
      }

      // Get parent references
      const sportsParent = savedCategories['sports-recreation'];
      const automotiveParent = savedCategories['automotive'];
      const personalCareParent = savedCategories['personal-care'];
      const healthWellnessParent = savedCategories['health-wellness'];

      const childCategories = [
        // Sports & Recreation sub-categories
        {
          parent_id: sportsParent?.id,
          name: 'Racket Sports',
          code: 'racket-sports',
          description:
            'Pickleball, badminton, tennis, and other racket sport courts',
          level: 1,
          display_order: 1,
          is_active: true,
          is_featured: false,
          default_platform_fee_percent: 10.0,
          icon_url: sportsParent?.icon_url,
          image_url: sportsParent?.image_url,
          created_by: user,
          updated_by: user,
        },
        {
          parent_id: sportsParent?.id,
          name: 'Kids Entertainment',
          code: 'kids-entertainment',
          description: 'Play areas, kids zones, and family-friendly activities',
          level: 1,
          display_order: 2,
          is_active: true,
          is_featured: false,
          default_platform_fee_percent: 10.0,
          icon_url: sportsParent?.icon_url,
          image_url: sportsParent?.image_url,
          created_by: user,
          updated_by: user,
        },
        // Automotive sub-categories
        {
          parent_id: automotiveParent?.id,
          name: 'Car Wash & Detailing',
          code: 'car-wash-detailing',
          description:
            'Car wash bays, detailing services, and vehicle cleaning',
          level: 1,
          display_order: 1,
          is_active: true,
          is_featured: false,
          default_platform_fee_percent: 10.0,
          icon_url: automotiveParent?.icon_url,
          image_url: automotiveParent?.image_url,
          created_by: user,
          updated_by: user,
        },
        // Personal Care sub-categories
        {
          parent_id: personalCareParent?.id,
          name: 'Barbershop',
          code: 'barbershop',
          description: 'Haircuts, shaving, and grooming services',
          level: 1,
          display_order: 1,
          is_active: true,
          is_featured: false,
          default_platform_fee_percent: 10.0,
          icon_url: personalCareParent?.icon_url,
          image_url: personalCareParent?.image_url,
          created_by: user,
          updated_by: user,
        },
        {
          parent_id: personalCareParent?.id,
          name: 'Nail Salon',
          code: 'nail-salon',
          description: 'Manicure, pedicure, and nail art services',
          level: 1,
          display_order: 2,
          is_active: true,
          is_featured: false,
          default_platform_fee_percent: 10.0,
          icon_url: personalCareParent?.icon_url,
          image_url: personalCareParent?.image_url,
          created_by: user,
          updated_by: user,
        },
        {
          parent_id: personalCareParent?.id,
          name: 'Massage & Spa',
          code: 'massage-spa',
          description: 'Massage therapy, spa treatments, and relaxation',
          level: 1,
          display_order: 3,
          is_active: true,
          is_featured: false,
          default_platform_fee_percent: 10.0,
          icon_url: personalCareParent?.icon_url,
          image_url: personalCareParent?.image_url,
          created_by: user,
          updated_by: user,
        },
        // Health & Wellness sub-categories
        {
          parent_id: healthWellnessParent?.id,
          name: 'Wellness Packages',
          code: 'wellness-packages',
          description: 'Full wellness and rejuvenation packages',
          level: 1,
          display_order: 1,
          is_active: true,
          is_featured: false,
          default_platform_fee_percent: 10.0,
          icon_url: healthWellnessParent?.icon_url,
          image_url: healthWellnessParent?.image_url,
          created_by: user,
          updated_by: user,
        },
        {
          parent_id: healthWellnessParent?.id,
          name: 'Fitness & Training',
          code: 'fitness-training',
          description: 'Personal training, fitness coaching, and consultations',
          level: 1,
          display_order: 2,
          is_active: true,
          is_featured: false,
          default_platform_fee_percent: 10.0,
          icon_url: healthWellnessParent?.icon_url,
          image_url: healthWellnessParent?.image_url,
          created_by: user,
          updated_by: user,
        },
      ];

      for (const childCat of childCategories) {
        if (childCat.parent_id) {
          await this.repository.save(this.repository.create(childCat));
        }
      }

      const totalCategories = parentCategories.length + childCategories.length;
      console.log(
        `✅ ${totalCategories} service categories seeded (${parentCategories.length} parent + ${childCategories.length} child)`,
      );
    }
  }
}
