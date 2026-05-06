import { NullableType } from '@/utils/types/nullable.type';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { Section } from '@/masters/sections/domain/section';
import { FindAllSectionsDto } from '@/masters/sections/dto/find-all-sections.dto';
import { User } from '@/users/domain/user';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';

/**
 * Abstract base repository for section data operations.
 *
 * This abstract class defines the contract for all section repository
 * implementations. It provides a consistent interface for section data
 * access operations including CRUD, pagination, filtering, and lookup.
 *
 * The repository pattern ensures separation of concerns between business
 * logic and data access, making the code more maintainable and testable.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * class SectionRepository implements BaseSectionRepository {
 *   async create(data: Section): Promise<Section> {
 *     // Implementation
 *   }
 * }
 * ```
 */
export abstract class BaseSectionRepository {
  /**
   * Creates a new section in the system.
   *
   * @param data - The section data to create (excluding auto-generated fields)
   * @returns Promise<Section> - The created section with generated ID
   */
  abstract create(
    data: Omit<Section, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Section>;

  /**
   * Retrieves sections using DevExtreme-compatible query parameters.
   *
   * @param loadOptions - DevExtreme query parameters including filter and sort
   * @returns Promise<DevExtremePaginatedResponseDto<Section>> - Paginated section data
   */
  abstract findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<Section>>;

  /**
   * Retrieves sections with custom pagination and filtering.
   *
   * @param filterQuery - Search criteria for filtering sections
   * @param paginationOptions - Pagination settings including page and limit
   * @returns Promise<IPaginatedResult<Section>> - Paginated section results
   */
  abstract findAllWithPagination({
    filterQuery,
    paginationOptions,
  }: {
    filterQuery?: FindAllSectionsDto['search'];
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<Section>>;

  /**
   * Retrieves a section by its unique identifier.
   *
   * @param id - The unique identifier of the section
   * @returns Promise<NullableType<Section>> - The section or null if not found
   */
  abstract findById(id: Section['id']): Promise<NullableType<Section>>;

  /**
   * Retrieves multiple sections by their identifiers.
   *
   * @param ids - Array of section identifiers to retrieve
   * @returns Promise<Section[]> - Array of found sections
   */
  abstract findByIds(ids: Section['id'][]): Promise<Section[]>;

  /**
   * Retrieves a section by its unique code.
   *
   * @param section_code - The unique section code
   * @returns Promise<NullableType<Section>> - The section or null if not found
   */
  abstract findByCode(
    section_code: Section['section_code'],
  ): Promise<NullableType<Section>>;

  /**
   * Retrieves all active sections in the system.
   *
   * @returns Promise<Pick<Section, 'id' | 'section_code' | 'section_name'>[]> - Array of active sections
   */
  abstract findAll(): Promise<
    Pick<Section, 'id' | 'section_code' | 'section_name'>[]
  >;

  /**
   * Retrieves distinct section names from the system.
   *
   * @returns Promise<Section[]> - Array of unique section names
   */
  abstract findDistinct(): Promise<Section[]>;

  /**
   * Updates an existing section with new information.
   *
   * @param id - The unique identifier of the section to update
   * @param payload - The updated section data
   * @returns Promise<Section> - The updated section
   */
  abstract update(
    id: Section['id'],
    payload: Partial<Section>,
  ): Promise<Section>;

  /**
   * Soft deletes a section from the system.
   *
   * @param id - The unique identifier of the section to delete
   * @param causer - The user performing the deletion action
   * @returns Promise<void>
   */
  abstract remove(id: Section['id'], causer: User): Promise<void>;

  /**
   * Performs a lookup operation for section selection.
   *
   * @param loadOptions - Lookup query parameters including search criteria
   * @param exclude - Optional exclusion criteria for sections
   * @returns Promise<{ data: { id: number; code: string; name: string }[]; totalCount: number }> - Lookup results
   */
  abstract lookup(
    loadOptions: LookUpDto,
    exclude?: BulkExcludeDto,
  ): Promise<{
    data: { id: number; code: string; name: string }[];
    totalCount: number;
  }>;
}
