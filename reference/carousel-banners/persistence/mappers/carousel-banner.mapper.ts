import { CarouselBanner } from '@/carousel-banners/domain/carousel-banner';
import { CarouselBannerEntity } from '@/carousel-banners/persistence/entities/carousel-banner.entity';
import { getCauser } from '@/utils/helpers/entity.helper';
import { MediaMapper } from '@/media/persistence/mappers/media.mapper';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { User } from '@/users/domain/user';

export class CarouselBannerMapper {
  static toDomain(raw: CarouselBannerEntity): CarouselBanner {
    const domainEntity: CarouselBanner = new CarouselBanner();
    Object.assign(domainEntity, raw);
    if (raw.media) {
      domainEntity.media = MediaMapper.toDomain(raw.media);
    }
    if (raw.created_by) {
      domainEntity.created_by = getCauser(raw.created_by);
    }
    if (raw.updated_by) {
      domainEntity.updated_by = getCauser(raw.updated_by);
    }
    if (raw.deleted_by) {
      domainEntity.deleted_by = getCauser(raw.deleted_by);
    }
    return domainEntity;
  }

  static toPersistence(domainEntity: CarouselBanner): CarouselBannerEntity {
    const persistenceEntity: CarouselBannerEntity = new CarouselBannerEntity();
    const { media, ...domainWithoutMedia } = domainEntity;
    void media;
    Object.assign(
      persistenceEntity,
      domainWithoutMedia as Omit<
        CarouselBanner,
        'id' | 'media' | 'created_by' | 'updated_by' | 'deleted_by'
      >,
    );
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    if (domainEntity.created_by) {
      persistenceEntity.created_by = UserMapper.toPersistence(
        domainEntity.created_by as User,
      );
    }
    if (domainEntity.updated_by) {
      persistenceEntity.updated_by = UserMapper.toPersistence(
        domainEntity.updated_by as User,
      );
    }
    if (domainEntity.deleted_by) {
      persistenceEntity.deleted_by = UserMapper.toPersistence(
        domainEntity.deleted_by as User,
      );
    }
    return persistenceEntity;
  }
}
