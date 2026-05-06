import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ISeedService } from '../seed.interface';
import { In, Repository } from 'typeorm';
import { CarouselBannerEntity } from '@/carousel-banners/persistence/entities/carousel-banner.entity';
import { MediaEntity } from '@/media/persistence/entities/media.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Injectable()
export class CarouselBannersSeedService implements ISeedService {
  private readonly mediaIds: readonly number[] = [1, 2, 3, 4, 5];

  constructor(
    @InjectRepository(CarouselBannerEntity)
    private readonly repository: Repository<CarouselBannerEntity>,
    @InjectRepository(MediaEntity)
    private readonly mediaRepository: Repository<MediaEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    const count = await this.repository.count();
    if (count) {
      console.log('⚠️  Carousel banners already exist, skipping seed');
      return;
    }

    const existingMediaCount = await this.mediaRepository.count({
      where: { id: In([...this.mediaIds]) },
    });

    if (existingMediaCount !== this.mediaIds.length) {
      console.error(
        `❌ Missing required media records. Expected ${this.mediaIds.length} media rows with ids ${this.mediaIds.join(
          ',',
        )}. Make sure the media seeder ran first.`,
      );
      return;
    }

    const adminUser = await this.userRepository.findOne({
      where: { id: 1 },
    });

    if (!adminUser) {
      console.error(
        '❌ No admin user found (id=1). Cannot seed carousel banners.',
      );
      return;
    }

    const bannersToCreate: Partial<CarouselBannerEntity>[] = this.mediaIds.map(
      (mediaId, index) => ({
        media_id: mediaId,
        headline: `Carousel Banner ${index + 1}`,
        subtext: `Seeded carousel banner ${index + 1}`,
        cta_text: 'Shop Now',
        cta_link: '/products',
        display_order: index,
        is_active: true,
        start_at: null,
        end_at: null,
        created_by: adminUser,
        updated_by: adminUser,
      }),
    );

    await this.repository.save(this.repository.create(bannersToCreate));
    console.log(
      `✅ Carousel banners seeded successfully (${bannersToCreate.length} banners created)`,
    );
  }
}
