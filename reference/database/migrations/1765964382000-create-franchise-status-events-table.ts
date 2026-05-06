import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateFranchiseStatusEventsTable1765964382000
  implements MigrationInterface
{
  name = 'CreateFranchiseStatusEventsTable1765964382000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'franchise_status_events',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'franchise_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'previous_status',
            type: 'enum',
            enum: ['Active', 'Inactive', 'Screening', 'Rejected'],
            isNullable: true,
          },
          {
            name: 'new_status',
            type: 'enum',
            enum: ['Active', 'Inactive', 'Screening', 'Rejected'],
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'franchise_status_events',
      new TableIndex({
        name: 'idx_franchise_status_events_franchise_id',
        columnNames: ['franchise_id'],
      }),
    );

    await queryRunner.createIndex(
      'franchise_status_events',
      new TableIndex({
        name: 'idx_franchise_status_events_created_at',
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createIndex(
      'franchise_status_events',
      new TableIndex({
        name: 'idx_franchise_status_events_franchise_created',
        columnNames: ['franchise_id', 'created_at'],
      }),
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'franchise_status_events',
      new TableForeignKey({
        columnNames: ['franchise_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'franchises',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'franchise_status_events',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('franchise_status_events');
  }
}
