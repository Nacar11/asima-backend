import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateDisputesTable1770788248356 implements MigrationInterface {
  name = 'CreateDisputesTable1770788248356';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create dispute status enum
    await queryRunner.query(`
      CREATE TYPE "dispute_status_enum" AS ENUM (
        'open', 'under_review', 'resolved', 'closed', 'escalated'
      )
    `);

    // Create dispute reason enum
    await queryRunner.query(`
      CREATE TYPE "dispute_reason_enum" AS ENUM (
        'poor_quality', 'incomplete_service', 'wrong_service', 'damage', 'no_show', 'overcharged', 'other'
      )
    `);

    // Create dispute resolution enum
    await queryRunner.query(`
      CREATE TYPE "dispute_resolution_enum" AS ENUM (
        'full_refund', 'partial_refund', 'no_refund', 'redo_service', 'mutual_agreement'
      )
    `);

    // Create disputes table
    await queryRunner.createTable(
      new Table({
        name: 'disputes',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'booking_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'customer_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'seller_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'dispute_number',
            type: 'varchar',
            length: '50',
            isNullable: true,
            isUnique: true,
          },
          {
            name: 'status',
            type: 'dispute_status_enum',
            default: `'open'`,
            isNullable: false,
          },
          {
            name: 'reason',
            type: 'dispute_reason_enum',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'evidence_urls',
            type: 'text[]',
            isNullable: true,
          },
          {
            name: 'requested_resolution',
            type: 'dispute_resolution_enum',
            isNullable: true,
          },
          {
            name: 'requested_refund_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'resolution',
            type: 'dispute_resolution_enum',
            isNullable: true,
          },
          {
            name: 'resolution_notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'resolved_by',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'resolved_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'refund_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'provider_response',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'provider_evidence_urls',
            type: 'text[]',
            isNullable: true,
          },
          {
            name: 'provider_responded_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_by',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['booking_id'],
            referencedTableName: 'bookings',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['customer_id'],
            referencedTableName: 'user',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['seller_id'],
            referencedTableName: 'sellers',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['resolved_by'],
            referencedTableName: 'user',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
          {
            columnNames: ['created_by'],
            referencedTableName: 'user',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
          {
            columnNames: ['updated_by'],
            referencedTableName: 'user',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      'disputes',
      new TableIndex({
        name: 'IDX_disputes_booking_id',
        columnNames: ['booking_id'],
      }),
    );
    await queryRunner.createIndex(
      'disputes',
      new TableIndex({
        name: 'IDX_disputes_customer_id',
        columnNames: ['customer_id'],
      }),
    );
    await queryRunner.createIndex(
      'disputes',
      new TableIndex({
        name: 'IDX_disputes_seller_id',
        columnNames: ['seller_id'],
      }),
    );
    await queryRunner.createIndex(
      'disputes',
      new TableIndex({
        name: 'IDX_disputes_status',
        columnNames: ['status'],
      }),
    );
    await queryRunner.createIndex(
      'disputes',
      new TableIndex({
        name: 'IDX_disputes_deleted_at',
        columnNames: ['deleted_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('disputes');
    await queryRunner.query(`DROP TYPE "dispute_resolution_enum"`);
    await queryRunner.query(`DROP TYPE "dispute_reason_enum"`);
    await queryRunner.query(`DROP TYPE "dispute_status_enum"`);
  }
}
