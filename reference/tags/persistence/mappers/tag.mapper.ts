import { Tag } from '@/tags/domain/tag';
import { TagEntity } from '@/tags/persistence/entities/tag.entity';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';

export class TagMapper {
  static toDomain(raw: TagEntity): Tag {
    const tag = new Tag();
    tag.id = raw.id;
    tag.seller_id = raw.seller_id;
    tag.name = raw.name;
    tag.slug = raw.slug;
    tag.description = raw.description;
    tag.product_count = 0; // Product count is calculated dynamically
    tag.display_order = raw.display_order;
    tag.status = raw.status;
    tag.created_at = raw.created_at;
    tag.updated_at = raw.updated_at;
    tag.deleted_at = raw.deleted_at;

    if (raw.seller) {
      tag.seller = UserMapper.toDomain(raw.seller);
    }

    if (raw.creator) {
      tag.created_by = UserMapper.toDomain(raw.creator);
    }

    if (raw.updater) {
      tag.updated_by = UserMapper.toDomain(raw.updater);
    }

    if (raw.deleter) {
      tag.deleted_by = UserMapper.toDomain(raw.deleter);
    }

    return tag;
  }

  static toPersistence(tag: Tag): TagEntity {
    const entity = new TagEntity();

    if (tag.id) {
      entity.id = tag.id;
    }

    entity.seller_id = tag.seller_id;
    entity.name = tag.name;
    entity.slug = tag.slug;
    entity.description = tag.description;
    entity.display_order = tag.display_order ?? 0;
    entity.status = tag.status;

    if (tag.created_at) {
      entity.created_at = tag.created_at;
    }

    if (tag.updated_at) {
      entity.updated_at = tag.updated_at;
    }

    if (tag.deleted_at) {
      entity.deleted_at = tag.deleted_at;
    }

    if (tag.created_by && typeof tag.created_by === 'object') {
      entity.created_by = tag.created_by.id;
    }

    if (tag.updated_by && typeof tag.updated_by === 'object') {
      entity.updated_by = tag.updated_by.id;
    }

    if (tag.deleted_by && typeof tag.deleted_by === 'object') {
      entity.deleted_by = tag.deleted_by.id;
    }

    return entity;
  }
}
