import { SellerCertification } from '@/seller-certifications/domain/seller-certification';
import { SellerCertificationEntity } from '@/seller-certifications/persistence/entities/seller-certification.entity';

export class SellerCertificationMapper {
  static toDomain(entity: SellerCertificationEntity): SellerCertification {
    const domain = new SellerCertification();
    domain.id = entity.id;
    domain.seller_id = entity.seller_id;
    domain.name = entity.name;
    domain.issuer = entity.issuer;
    domain.image_url = entity.image_url;
    domain.credential_id = entity.credential_id;
    domain.credential_url = entity.credential_url;
    domain.issue_date = entity.issue_date;
    domain.expiry_date = entity.expiry_date;
    domain.status = entity.status;
    domain.created_at = entity.created_at;
    domain.updated_at = entity.updated_at;
    domain.deleted_at = entity.deleted_at;

    if (entity.created_by) {
      domain.created_by = {
        id: entity.created_by.id,
        first_name: entity.created_by.first_name,
        last_name: entity.created_by.last_name,
      };
    }

    if (entity.updated_by) {
      domain.updated_by = {
        id: entity.updated_by.id,
        first_name: entity.updated_by.first_name,
        last_name: entity.updated_by.last_name,
      };
    }

    if (entity.deleted_by) {
      domain.deleted_by = {
        id: entity.deleted_by.id,
        first_name: entity.deleted_by.first_name,
        last_name: entity.deleted_by.last_name,
      };
    }

    return domain;
  }

  static toPersistence(
    domain: Partial<SellerCertification>,
  ): Partial<SellerCertificationEntity> {
    const entity: Partial<SellerCertificationEntity> = {};

    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.seller_id !== undefined) entity.seller_id = domain.seller_id;
    if (domain.name !== undefined) entity.name = domain.name;
    if (domain.issuer !== undefined) entity.issuer = domain.issuer;
    if (domain.image_url !== undefined) entity.image_url = domain.image_url;
    if (domain.credential_id !== undefined)
      entity.credential_id = domain.credential_id;
    if (domain.credential_url !== undefined)
      entity.credential_url = domain.credential_url;
    if (domain.issue_date !== undefined) entity.issue_date = domain.issue_date;
    if (domain.expiry_date !== undefined)
      entity.expiry_date = domain.expiry_date;
    if (domain.status !== undefined) entity.status = domain.status;

    if (domain.created_by) {
      entity.created_by = { id: domain.created_by.id } as any;
    }
    if (domain.updated_by) {
      entity.updated_by = { id: domain.updated_by.id } as any;
    }
    if (domain.deleted_by) {
      entity.deleted_by = { id: domain.deleted_by.id } as any;
    }

    return entity;
  }
}
