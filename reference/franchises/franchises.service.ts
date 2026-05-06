import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { BaseFranchiseRepository } from '@/franchises/persistence/base-franchise.repository';
import { Franchise } from '@/franchises/domain/franchise';
import { FindAllFranchise } from '@/franchises/domain/find-all-franchise';
import { FranchiseStatusEvent } from '@/franchises/domain/franchise-status-event';
import { CreateFranchiseDto } from '@/franchises/dto/create-franchise.dto';
import { UpdateFranchiseDto } from '@/franchises/dto/update-franchise.dto';
import { QueryFranchiseDto } from '@/franchises/dto/query-franchise.dto';
import { FranchiseStatusEventsService } from '@/franchises/franchise-status-events.service';
import { User } from '@/users/domain/user';
import {
  FRANCHISE_DEFAULT_STATUS,
  FRANCHISE_DEFAULT_COUNTRY,
} from '@/franchises/franchises.constants';
import { FranchiseStatusEnum } from '@/franchises/domain/franchise-status.enum';

/**
 * Service for franchise business logic
 */
@Injectable()
export class FranchisesService {
  constructor(
    private readonly repository: BaseFranchiseRepository,
    private readonly statusEventsService: FranchiseStatusEventsService,
  ) {}

  /**
   * Create a new franchise
   */
  async create(input: CreateFranchiseDto, causer: User): Promise<Franchise> {
    const status = input.status ?? FRANCHISE_DEFAULT_STATUS;
    const isActive = status === FranchiseStatusEnum.ACTIVE;

    const franchise = Object.assign(new Franchise(), input, {
      status,
      country: input.country ?? FRANCHISE_DEFAULT_COUNTRY,
      onboarded_at: isActive ? new Date() : null,
      created_by: causer,
      updated_by: causer,
    });

    let createdFranchise: Franchise;
    try {
      createdFranchise = await this.repository.create(franchise);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException(
          'A franchise with this email already exists',
        );
      }
      throw error;
    }

    // Create initial status event
    await this.statusEventsService.createEvent(
      createdFranchise.id,
      null,
      createdFranchise.status,
      'Franchise created',
      causer,
    );

    return createdFranchise;
  }

  /**
   * Get all franchises with pagination and filters
   */
  async findAll(query: QueryFranchiseDto): Promise<FindAllFranchise> {
    return this.repository.findAll(query);
  }

  /**
   * Get a franchise by ID
   */
  async findById(id: number): Promise<Franchise> {
    const franchise = await this.repository.findById(id);
    if (!franchise) {
      throw new NotFoundException(`Franchise with id ${id} not found`);
    }
    return franchise;
  }

  /**
   * Get status history for a franchise
   */
  async getStatusHistory(id: number): Promise<FranchiseStatusEvent[]> {
    await this.findById(id); // Verify franchise exists
    return this.statusEventsService.getStatusHistory(id);
  }

  /**
   * Update a franchise
   */
  async update(
    id: number,
    input: UpdateFranchiseDto,
    causer: User,
  ): Promise<Franchise> {
    const existingFranchise = await this.findById(id);
    const previousStatus = existingFranchise.status;

    const partialFranchise: Partial<Franchise> = new Franchise();
    Object.assign(partialFranchise, input, {
      updated_by: causer,
    });

    // Handle onboarded_at based on status changes
    if (input.status && input.status !== previousStatus) {
      if (input.status === FranchiseStatusEnum.ACTIVE) {
        // Set onboarded_at when status changes TO Active (only if not already set)
        if (!existingFranchise.onboarded_at) {
          partialFranchise.onboarded_at = new Date();
        }
      } else if (input.status === FranchiseStatusEnum.REJECTED) {
        // Clear onboarded_at when status changes TO Rejected (contract terminated)
        partialFranchise.onboarded_at = null;
      }
      // Note: Inactive keeps onboarded_at (franchise was onboarded, just paused)
    }

    // Remove status_change_description from the update payload
    delete (partialFranchise as any).status_change_description;

    let updatedFranchise: Franchise;
    try {
      updatedFranchise = await this.repository.update(id, partialFranchise);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException(
          'A franchise with this email already exists',
        );
      }
      throw error;
    }

    // Log status change if status was updated
    if (input.status && input.status !== previousStatus) {
      await this.statusEventsService.createEvent(
        id,
        previousStatus,
        input.status,
        input.status_change_description || null,
        causer,
      );
    }

    return updatedFranchise;
  }

  /**
   * Delete a franchise (soft delete)
   */
  async delete(id: number, causer: User): Promise<void> {
    await this.findById(id);
    const partialFranchise: Partial<Franchise> = new Franchise();
    Object.assign(partialFranchise, {
      deleted_by: causer,
    });
    await this.repository.update(id, partialFranchise);
    await this.repository.remove(id);
  }
}
