import {
  Controller,
  Get,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

/**
 * Controller for the Masters Module - Centralized organizational management.
 *
 * This controller provides information and metadata about the Masters Module,
 * which manages the organizational hierarchy including cost centers, departments,
 * divisions, sections, and sub-sections. It serves as the main entry point
 * for understanding the module's capabilities and available endpoints.
 *
 * The Masters Module provides comprehensive CRUD operations, status management,
 * bulk operations, advanced filtering, pagination, lookup operations, audit trails,
 * and soft delete functionality across all organizational entities.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * // Get module information
 * const info = await this.getModuleInfo();
 * // Returns: { module: 'Masters Module', description: '...', endpoints: {...} }
 *
 * // Get all available endpoints
 * const endpoints = await this.getEndpoints();
 * // Returns: { costCenters: [...], departments: [...], ... }
 * ```
 */
@ApiTags('Masters')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'masters',
  version: '3',
})
export class MastersController {
  /**
   * Retrieves comprehensive information about the Masters Module.
   *
   * Returns detailed metadata about the Masters Module including its purpose,
   * available endpoints, features, and documentation status. This endpoint
   * serves as a discovery mechanism for understanding the module's capabilities
   * and available organizational management features.
   *
   * @returns Object containing module information, endpoints, features, and documentation status
   *
   * @example
   * ```typescript
   * const info = await this.getModuleInfo();
   * // Returns: {
   * //   module: 'Masters Module',
   * //   description: 'Centralized organizational management system',
   * //   version: '3',
   * //   endpoints: { costCenters: '/api/v3/cost-centers', ... },
   * //   features: ['CRUD Operations', 'Status Management', ...],
   * //   documentation: { status: 'Complete', coverage: 'All functions documented' }
   * // }
   * ```
   */
  @Get('info')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Masters Module information and available endpoints',
    schema: {
      type: 'object',
      properties: {
        module: { type: 'string', example: 'Masters Module' },
        description: {
          type: 'string',
          example: 'Centralized organizational management',
        },
        version: { type: 'string', example: '3' },
        endpoints: {
          type: 'object',
          properties: {
            costCenters: { type: 'string', example: '/api/v3/cost-centers' },
            departments: { type: 'string', example: '/api/v3/departments' },
            divisions: { type: 'string', example: '/api/v3/divisions' },
            sections: { type: 'string', example: '/api/v3/sections' },
            subSections: { type: 'string', example: '/api/v3/sub-sections' },
          },
        },
        features: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'CRUD Operations',
            'Status Management (Hold, Activate, Cancel)',
            'Bulk Operations',
            'Advanced Filtering',
            'Pagination',
            'Lookup Operations',
            'Audit Trails',
            'Soft Delete',
          ],
        },
      },
    },
  })
  getModuleInfo() {
    return {
      module: 'Masters Module',
      description: 'Centralized organizational management system',
      version: '3',
      endpoints: {
        costCenters: '/api/v3/cost-centers',
        departments: '/api/v3/departments',
        divisions: '/api/v3/divisions',
        sections: '/api/v3/sections',
        subSections: '/api/v3/sub-sections',
      },
      features: [
        'CRUD Operations',
        'Status Management (Hold, Activate, Cancel)',
        'Bulk Operations',
        'Advanced Filtering',
        'Pagination',
        'Lookup Operations',
        'Audit Trails',
        'Soft Delete',
        'Complete JSDoc Documentation',
        'Compodocs Integration',
      ],
      documentation: {
        status: 'Complete',
        coverage: 'All functions documented',
        standards: 'JSDoc compliant',
        compodocs: 'Fully integrated',
      },
    };
  }
  /**
   * Retrieves a complete list of all available organizational endpoints.
   *
   * Returns detailed information about all HTTP endpoints available across
   * the Masters Module, including cost centers, departments, divisions,
   * sections, and sub-sections. Each endpoint includes the HTTP method,
   * URL path, and description of its functionality.
   *
   * This endpoint is useful for API discovery, documentation generation,
   * and client application development.
   *
   * @returns Object containing arrays of endpoint information for each organizational entity
   *
   * @example
   * ```typescript
   * const endpoints = await this.getEndpoints();
   * // Returns: {
   * //   costCenters: [
   * //     { method: 'POST', endpoint: '/api/v3/cost-centers', description: 'Create a new cost center' },
   * //     { method: 'GET', endpoint: '/api/v3/cost-centers', description: 'Get cost centers with filtering' },
   * //     ...
   * //   ],
   * //   departments: [...],
   * //   divisions: [...],
   * //   sections: [...],
   * //   subSections: [...]
   * // }
   * ```
   */
  @Get('endpoints')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Complete list of available organizational endpoints',
    schema: {
      type: 'object',
      properties: {
        costCenters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              endpoint: { type: 'string' },
              description: { type: 'string' },
            },
          },
        },
        departments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              endpoint: { type: 'string' },
              description: { type: 'string' },
            },
          },
        },
        divisions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              endpoint: { type: 'string' },
              description: { type: 'string' },
            },
          },
        },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              endpoint: { type: 'string' },
              description: { type: 'string' },
            },
          },
        },
        subSections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              endpoint: { type: 'string' },
              description: { type: 'string' },
            },
          },
        },
      },
    },
  })
  getEndpoints() {
    return {
      costCenters: [
        {
          method: 'POST',
          endpoint: '/api/v3/cost-centers',
          description: 'Create a new cost center',
        },
        {
          method: 'GET',
          endpoint: '/api/v3/cost-centers',
          description: 'Get cost centers with filtering',
        },
        {
          method: 'GET',
          endpoint: '/api/v3/cost-centers/:id',
          description: 'Get cost center by ID',
        },
        {
          method: 'PATCH',
          endpoint: '/api/v3/cost-centers/:id',
          description: 'Update cost center',
        },
        {
          method: 'DELETE',
          endpoint: '/api/v3/cost-centers/:id',
          description: 'Delete cost center',
        },
        {
          method: 'PATCH',
          endpoint: '/api/v3/cost-centers/:id/hold',
          description: 'Hold cost center',
        },
        {
          method: 'PATCH',
          endpoint: '/api/v3/cost-centers/:id/activate',
          description: 'Activate cost center',
        },
        {
          method: 'PATCH',
          endpoint: '/api/v3/cost-centers/:id/cancel',
          description: 'Cancel cost center',
        },
        {
          method: 'DELETE',
          endpoint: '/api/v3/cost-centers/bulk-delete',
          description: 'Bulk delete cost centers',
        },
      ],
      departments: [
        {
          method: 'POST',
          endpoint: '/api/v3/departments',
          description: 'Create a new department',
        },
        {
          method: 'GET',
          endpoint: '/api/v3/departments',
          description: 'Get departments with filtering',
        },
        {
          method: 'GET',
          endpoint: '/api/v3/departments/:id',
          description: 'Get department by ID',
        },
        {
          method: 'PATCH',
          endpoint: '/api/v3/departments/:id',
          description: 'Update department',
        },
        {
          method: 'DELETE',
          endpoint: '/api/v3/departments/:id',
          description: 'Delete department',
        },
        {
          method: 'PATCH',
          endpoint: '/api/v3/departments/:id/hold',
          description: 'Hold department',
        },
        {
          method: 'PATCH',
          endpoint: '/api/v3/departments/:id/activate',
          description: 'Activate department',
        },
        {
          method: 'PATCH',
          endpoint: '/api/v3/departments/:id/cancel',
          description: 'Cancel department',
        },
        {
          method: 'DELETE',
          endpoint: '/api/v3/departments/bulk-delete',
          description: 'Bulk delete departments',
        },
      ],
      divisions: [
        {
          method: 'POST',
          endpoint: '/api/v3/divisions',
          description: 'Create a new division',
        },
        {
          method: 'GET',
          endpoint: '/api/v3/divisions',
          description: 'Get divisions with filtering',
        },
        {
          method: 'GET',
          endpoint: '/api/v3/divisions/:id',
          description: 'Get division by ID',
        },
        {
          method: 'PATCH',
          endpoint: '/api/v3/divisions/:id',
          description: 'Update division',
        },
        {
          method: 'DELETE',
          endpoint: '/api/v3/divisions/:id',
          description: 'Delete division',
        },
        {
          method: 'PATCH',
          endpoint: '/api/v3/divisions/:id/hold',
          description: 'Hold division',
        },
        {
          method: 'PATCH',
          endpoint: '/api/v3/divisions/:id/activate',
          description: 'Activate division',
        },
        {
          method: 'PATCH',
          endpoint: '/api/v3/divisions/:id/cancel',
          description: 'Cancel division',
        },
        {
          method: 'DELETE',
          endpoint: '/api/v3/divisions/bulk-delete',
          description: 'Bulk delete divisions',
        },
      ],
      sections: [
        {
          method: 'POST',
          endpoint: '/api/v3/sections',
          description: 'Create a new section',
        },
        {
          method: 'GET',
          endpoint: '/api/v3/sections',
          description: 'Get sections with filtering',
        },
        {
          method: 'GET',
          endpoint: '/api/v3/sections/:id',
          description: 'Get section by ID',
        },
        {
          method: 'PATCH',
          endpoint: '/api/v3/sections/:id',
          description: 'Update section',
        },
        {
          method: 'DELETE',
          endpoint: '/api/v3/sections/:id',
          description: 'Delete section',
        },
        {
          method: 'PATCH',
          endpoint: '/api/v3/sections/:id/hold',
          description: 'Hold section',
        },
        {
          method: 'PATCH',
          endpoint: '/api/v3/sections/:id/activate',
          description: 'Activate section',
        },
        {
          method: 'PATCH',
          endpoint: '/api/v3/sections/:id/cancel',
          description: 'Cancel section',
        },
        {
          method: 'DELETE',
          endpoint: '/api/v3/sections/bulk-delete',
          description: 'Bulk delete sections',
        },
      ],
      subSections: [
        {
          method: 'POST',
          endpoint: '/api/v3/sub-sections',
          description: 'Create a new sub-section',
        },
        {
          method: 'GET',
          endpoint: '/api/v3/sub-sections',
          description: 'Get sub-sections with filtering',
        },
        {
          method: 'GET',
          endpoint: '/api/v3/sub-sections/:id',
          description: 'Get sub-section by ID',
        },
        {
          method: 'PATCH',
          endpoint: '/api/v3/sub-sections/:id',
          description: 'Update sub-section',
        },
        {
          method: 'DELETE',
          endpoint: '/api/v3/sub-sections/:id',
          description: 'Delete sub-section',
        },
        {
          method: 'PATCH',
          endpoint: '/api/v3/sub-sections/:id/hold',
          description: 'Hold sub-section',
        },
        {
          method: 'PATCH',
          endpoint: '/api/v3/sub-sections/:id/activate',
          description: 'Activate sub-section',
        },
        {
          method: 'PATCH',
          endpoint: '/api/v3/sub-sections/:id/cancel',
          description: 'Cancel sub-section',
        },
        {
          method: 'DELETE',
          endpoint: '/api/v3/sub-sections/bulk-delete',
          description: 'Bulk delete sub-sections',
        },
      ],
    };
  }
}
