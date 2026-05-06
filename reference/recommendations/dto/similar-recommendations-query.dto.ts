import { QueryProductDto } from '@/products/dto/query-product.dto';

/**
 * Internal query DTO used by the recommendations service when fetching
 * candidate products for the "similar" recommendation type.
 * Extends QueryProductDto to stay compatible with productRepository.findAll.
 */
export class SimilarRecommendationsQueryDto extends QueryProductDto {}
