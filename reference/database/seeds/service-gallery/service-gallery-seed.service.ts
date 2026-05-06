import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceGalleryEntity } from '@/service-gallery/persistence/entities/service-gallery.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ISeedService } from '../seed.interface';

/**
 * Service for seeding service gallery
 */
@Injectable()
export class ServiceGallerySeedService implements ISeedService {
  constructor(
    @InjectRepository(ServiceGalleryEntity)
    private repository: Repository<ServiceGalleryEntity>,
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
          '❌ No user found. Cannot proceed to seed service gallery.',
        );
        return;
      }

      const services = await this.serviceRepository.find({
        take: 3,
        relations: ['category'],
      });

      if (services.length === 0) {
        console.log('⚠️  No services found. Skipping service gallery seed.');
        return;
      }

      const galleryItems: Array<{
        service_id: number;
        image_url: string;
        caption: string;
        alt_text: string;
        is_primary: boolean;
        display_order: number;
        created_by: UserEntity;
        updated_by: UserEntity;
      }> = [];

      for (const service of services) {
        // Use category image if available, otherwise use default travajoe_menu.png image
        const imageUrl =
          service.category?.image_url ??
          '/assets/images/travajo/travajoe_menu.png';
        galleryItems.push({
          service_id: service.id,
          image_url: imageUrl,
          caption: `Gallery image for ${service.title}`,
          alt_text: service.title,
          is_primary: true,
          display_order: 0,
          created_by: user,
          updated_by: user,
        });
      }

      await this.repository.save(
        galleryItems.map((item) => this.repository.create(item)),
      );

      console.log(
        `✅ ${galleryItems.length} service gallery items seeded successfully`,
      );
    }
  }
}
