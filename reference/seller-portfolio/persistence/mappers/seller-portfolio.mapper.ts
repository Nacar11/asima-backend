import { SellerPortfolio } from '@/seller-portfolio/domain/seller-portfolio';
import { SellerPortfolioEntity } from '@/seller-portfolio/persistence/entities/seller-portfolio.entity';

export class SellerPortfolioMapper {
  static toDomain(entity: SellerPortfolioEntity): SellerPortfolio {
    const domain = new SellerPortfolio();
    domain.id = entity.id;
    domain.seller_id = entity.seller_id;
    domain.title = entity.title;
    domain.description = entity.description;
    domain.image_url = entity.image_url;
    domain.project_url = entity.project_url;
    domain.display_order = entity.display_order;
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
    domain: Partial<SellerPortfolio>,
  ): Partial<SellerPortfolioEntity> {
    const entity: Partial<SellerPortfolioEntity> = {};

    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.seller_id !== undefined) entity.seller_id = domain.seller_id;
    if (domain.title !== undefined) entity.title = domain.title;
    if (domain.description !== undefined)
      entity.description = domain.description;
    if (domain.image_url !== undefined) entity.image_url = domain.image_url;
    if (domain.project_url !== undefined)
      entity.project_url = domain.project_url;
    if (domain.display_order !== undefined)
      entity.display_order = domain.display_order;
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
