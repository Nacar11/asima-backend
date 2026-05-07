PRD: Categories Module Architecture
1. Executive Summary
Goal: Create a robust, scalable Categories module to manage product categorizations. Key Constraint: Strict separation of concerns. The database schema (Persistence) must not dictate the business rules (Domain). Table: categories (Single table with self-referencing hierarchy for sub-categories).

2. Architectural Layers (The "Onion")
The module is structured so dependencies point inwards. The Domain knows nothing about the Database.

Code snippet

graph TD
    subgraph "Interface Layer (HTTP)"
        Controller[CategoriesController]
    end

    subgraph "Application Layer (Use Cases)"
        Service[CategoriesService]
        DTOs[CreateCategoryDTO, CategoryResponseDTO]
    end

    subgraph "Domain Layer (Core - Pure TS)"
        DomainEntity[Category (Aggregate Root)]
        RepoPort[ICategoryRepository (Interface)]
        DomainErrors[Domain Errors]
    end

    subgraph "Infrastructure Layer (Persistence)"
        RepoImpl[TypeORMRepositoryAdapter]
        PersistEntity[CategoryEntity (DB Schema)]
        Mapper[CategoryMapper]
    end

    Controller --> Service
    Service --> RepoPort
    Service --> DomainEntity
    RepoImpl ..|> RepoPort
    RepoImpl --> PersistEntity
    RepoImpl --> Mapper
    Mapper --> DomainEntity
3. Component Specifications
A. The Domain Layer (Core Logic)
This is the heart of the module. No NestJS decorators, no TypeORM, just logic.

1. Domain Entity (Category)

Responsibility: Enforces invariants (business rules).

Attributes: id, name, slug, isActive, parentId, createdAt.

Behaviors (Methods):

activate() / deactivate()

rename(newName): Regenerates slug automatically.

moveTo(newParentId): Prevents circular dependency logic (e.g., cannot be own parent).

constructor(): Validates that name is not empty.

2. Repository Port (ICategoryRepository)

Responsibility: Defines what persistence operations are needed, not how they are done.

Contract:

TypeScript

interface ICategoryRepository {
  save(category: Category): Promise<void>;
  findById(id: string): Promise<Category | null>;
  find(filters: CategoryFilters): Promise<Category[]>; // Systemized Filters
  delete(id: string): Promise<void>;
}
B. The Infrastructure Layer (The "Plumbing")
Handles the database implementation.

1. Persistence Entity (CategoryEntity)

Responsibility: Maps strictly to the database table.

Tools: TypeORM @Entity, @Column, @ManyToOne.

Structure:

TypeScript

@Entity('categories')
export class CategoryEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() name: string;
  @Column() slug: string;
  @Column({ default: true }) is_active: boolean; // Note snake_case DB mapping
  @Column({ nullable: true }) parent_id: string;
}
2. The Mapper (CategoryMapper)

Responsibility: Converts between Domain <-> Persistence.

Logic:

toDomain(entity: CategoryEntity): Category

toPersistence(domain: Category): CategoryEntity

3. Repository Implementation (CategoryRepository)

Responsibility: Implements ICategoryRepository. Uses the "Systemized Filters."

Logic:

Receives CategoryFilters (Domain object).

Constructs a TypeORM QueryBuilder or FindOptions.

Executes query.

Maps result to Domain Entity before returning.

C. The Application Layer (The Orchestrator)
Coordinates the flow.

1. The Service (CategoriesService)

Responsibility: Transaction management, I/O coordination.

Flow Example (Create Category):

Accept CreateCategoryDto.

Check for uniqueness (using Repo).

Instantiate Domain Entity: const category = new Category({ ... }).

Call Repository: await this.repo.save(category).

Return DTO (using a DTO mapper).

4. The Data Flow: "Create Category"
Here is the lifecycle of a single request to prove the separation works.

Step 1: Interface

User POSTs JSON to /categories.

Controller validates types using class-validator. Calls Service.create().

Step 2: Service (Application)

Service receives clean data.

Service invokes Domain Logic: Category.create({ name: 'Electronics' }).

Step 3: Domain

Category Domain Class runs logic:

"Is name empty?" -> No.

"Generate slug" -> 'electronics'.

Sets isActive to default true.

Returns valid Category domain object to Service.

Step 4: Infrastructure (Persistence)

Service passes Domain Object to Repository.save(category).

Repository calls Mapper.toPersistence(category).

Converts isActive (Domain) -> is_active (DB Column).

Repository uses TypeORM to save to SQL table.

Step 5: Return

Repository returns void (or the saved domain object).

Service maps Domain Object -> CategoryResponseDTO (hiding internal flags if needed).

Controller sends HTTP 201.

5. Systemized Filters Strategy
To keep the Repository "dumb" but powerful, we define a strict Filter Interface in the Domain layer.

The Interface (Domain Layer):

TypeScript

export interface CategoryFilters {
  search?: string;        // Matches name or slug
  isActive?: boolean;     // Status filter
  parentId?: string;      // Hierarchy filter
  includeChildren?: boolean; // Relation loading
  page?: number;          // Pagination
  limit?: number;         // Pagination
}
The Implementation (Infra Layer): The Repository implementation converts this clean object into messy SQL/ORM logic.

TypeScript

// Inside Infrastructure Repository
async find(filters: CategoryFilters): Promise<Category[]> {
  const qb = this.ormRepo.createQueryBuilder('c');

  if (filters.search) {
    qb.andWhere('c.name ILIKE :search', { search: `%${filters.search}%` });
  }
  if (filters.isActive !== undefined) {
    qb.andWhere('c.is_active = :active', { active: filters.isActive });
  }
  
  const entities = await qb.getMany();
  return entities.map(CategoryMapper.toDomain); // Always return Domain Objects
}
6. Success Metrics & Validation
Strict Boundaries: The Category class inside the domain folder must generally have zero imports from @nestjs/* or typeorm.

Testability:

You can write unit tests for Category.rename() without mocking a database.

You can write tests for CategoriesService by mocking the ICategoryRepository interface.

Flexibility: If we rename the database column is_active to status_flag, we only change code in the Mapper and Persistence Entity. The Service and Controller remain untouched.