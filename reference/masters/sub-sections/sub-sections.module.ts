import { Module } from '@nestjs/common';
import { SubSectionsService } from '@/masters/sub-sections/sub-sections.service';
import { SubSectionsController } from '@/masters/sub-sections/sub-sections.controller';
import { SubSectionPersistenceModule } from '@/masters/sub-sections/persistence/persistence.module';
import { UsersModule } from '@/users/users.module';

/**
 * Main module for sub-section management in the organizational hierarchy.
 *
 * This module integrates all sub-section-related components including
 * services, controllers, and persistence layers. It provides a complete
 * solution for sub-section management with proper dependency injection
 * and module organization.
 *
 * The module includes:
 * - Sub-section service for business logic
 * - Sub-section controller for API endpoints
 * - Persistence module for data access
 * - User module integration for relationships
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 */
@Module({
  imports: [SubSectionPersistenceModule, UsersModule],
  controllers: [SubSectionsController],
  providers: [SubSectionsService],
  exports: [SubSectionsService, SubSectionPersistenceModule],
})
export class SubSectionsModule {}
