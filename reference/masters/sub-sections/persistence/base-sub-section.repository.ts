import { NullableType } from '@/utils/types/nullable.type';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { SubSection } from '@/masters/sub-sections/domain/sub-section';
import { FindAllSubSectionsDto } from '@/masters/sub-sections/dto/find-all-sub-sections.dto';
import { User } from '@/users/domain/user';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';

/**
 * Abstract base repository for sub-section data operations.
 *
 * This abstract class defines the contract for all sub-section repository
 * implementations. It provides a consistent interface for data access
 * operations including CRUD, pagination, filtering, and lookup functionality.
 *
 * The repository includes advanced features such as:
 * - DevExtreme-compatible filtering and sorting
 * - Complex relationship queries with joins
 * - Soft delete operations with transaction support
 * - Advanced lookup operations with exclusion support
 * - Status-based filtering and search capabilities
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 */
export abstract class BaseSubSectionRepository {
  /**
   * Creates a new sub-section in the database.
   *
   * This method persists a new sub-section entity to the database,
   * handling all necessary data transformations and relationship
   * mappings. It returns the complete sub-section with generated ID.
   *
   * @param data - The sub-section data to create (excluding auto-generated fields)
   * @returns Promise<SubSection> - The created sub-section with all fields populated
   */
  abstract create(
    data: Omit<SubSection, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<SubSection>;

  /**
   * Retrieves sub-sections using DevExtreme-compatible query parameters.
   *
   * This method processes DevExtreme grid parameters including filtering,
   * sorting, and pagination. It supports complex filtering operations
   * and returns data in a format compatible with DevExtreme components.
   *
   * @param loadOptions - DevExtreme query parameters including filter and sort
   * @returns Promise<DevExtremePaginatedResponseDto<SubSection>> - Paginated sub-section data
   */
  abstract findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<SubSection>>;

  /**
   * Retrieves sub-sections with custom pagination and filtering.
   *
   * This method provides paginated access to sub-sections with custom
   * filtering capabilities. It supports search functionality across
   * sub-section fields and returns paginated results with metadata.
   *
   * @param filterQuery - Search criteria for filtering sub-sections
   * @param paginationOptions - Pagination settings including page and limit
   * @returns Promise<IPaginatedResult<SubSection>> - Paginated sub-section results
   */
  abstract findAllWithPagination({
    filterQuery,
    paginationOptions,
  }: {
    filterQuery: FindAllSubSectionsDto['search'];
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<SubSection>>;

  /**
   * Retrieves a sub-section by its unique identifier.
   *
   * This method finds a sub-section by its ID and returns the complete
   * sub-section information including relationships. It performs validation
   * to ensure the sub-section exists before returning the data.
   *
   * @param id - The unique identifier of the sub-section
   * @returns Promise<NullableType<SubSection>> - The sub-section or null if not found
   */
  abstract findById(id: SubSection['id']): Promise<NullableType<SubSection>>;

  /**
   * Retrieves a sub-section by its unique code.
   *
   * This method finds a sub-section using its business code rather than
   * the database ID. It's useful for business operations that reference
   * sub-sections by their human-readable codes.
   *
   * @param sub_section_code - The unique sub-section code
   * @returns Promise<NullableType<SubSection>> - The sub-section or null if not found
   */
  abstract findByCode(
    sub_section_code: SubSection['sub_section_code'],
  ): Promise<NullableType<SubSection>>;

  /**
   * Retrieves multiple sub-sections by their identifiers.
   *
   * This method efficiently retrieves multiple sub-sections in a single query
   * using the provided array of IDs. It returns all matching sub-sections
   * without throwing errors for missing ones.
   *
   * @param ids - Array of sub-section identifiers to retrieve
   * @returns Promise<SubSection[]> - Array of found sub-sections
   */
  abstract findByIds(ids: SubSection['id'][]): Promise<SubSection[]>;

  /**
   * Retrieves all active sub-sections in the system.
   *
   * This method returns a simplified list of all active sub-sections
   * containing only essential information (id, code, name, head). It's
   * optimized for dropdown lists and selection components.
   *
   * @returns Promise<Pick<SubSection, 'id' | 'sub_section_code' | 'sub_section_name' | 'sub_section_head'>[]> - Array of active sub-sections
   */
  abstract findAll(): Promise<
    Pick<
      SubSection,
      'id' | 'sub_section_code' | 'sub_section_name' | 'sub_section_head'
    >[]
  >;

  /**
   * Retrieves distinct sub-section names from the system.
   *
   * This method returns a unique list of sub-section names, useful for
   * generating reports or analytics. It performs a distinct query
   * to eliminate duplicate names.
   *
   * @returns Promise<SubSection[]> - Array of unique sub-section names
   */
  abstract findDistinct(): Promise<SubSection[]>;

  /**
   * Updates an existing sub-section with new information.
   *
   * This method updates a sub-section's properties while performing validation
   * to ensure code uniqueness and sub-section head existence. It handles partial
   * updates and maintains data integrity through business rule validation.
   *
   * @param id - The unique identifier of the sub-section to update
   * @param payload - The updated sub-section data
   * @returns Promise<SubSection> - The updated sub-section
   */
  abstract update(
    id: SubSection['id'],
    payload: Partial<SubSection>,
  ): Promise<SubSection>;

  /**
   * Soft deletes a sub-section from the system.
   *
   * This method performs a soft delete operation, marking the sub-section
   * as deleted while preserving the data for audit purposes. It updates
   * the status to cancelled and records the deletion information.
   *
   * @param id - The unique identifier of the sub-section to delete
   * @param causer - The user performing the deletion action
   * @returns Promise<void>
   */
  abstract remove(id: SubSection['id'], causer: User): Promise<void>;

  /**
   * Performs a lookup operation for sub-section selection.
   *
   * This method provides optimized sub-section lookup functionality for
   * selection components. It supports filtering, sorting, and exclusion
   * of specific sub-sections from the results.
   *
   * @param loadOptions - Lookup query parameters including search criteria
   * @param exclude - Optional exclusion criteria for sub-sections
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
