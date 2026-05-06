import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateFranchisesTable1765964381000 implements MigrationInterface {
  name = 'CreateFranchisesTable1765964381000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'franchises',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'owner_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'address_line1',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'address_line2',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'city',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'state_province',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'postal_code',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'country',
            type: 'varchar',
            length: '100',
            default: "'Philippines'",
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['Active', 'Inactive', 'Screening', 'Rejected'],
            default: "'Screening'",
            isNullable: false,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'onboarded_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'deleted_by',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'franchises',
      new TableIndex({
        name: 'idx_franchises_name',
        columnNames: ['name'],
      }),
    );

    await queryRunner.createIndex(
      'franchises',
      new TableIndex({
        name: 'idx_franchises_email',
        columnNames: ['email'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'franchises',
      new TableIndex({
        name: 'idx_franchises_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'franchises',
      new TableIndex({
        name: 'idx_franchises_deleted_at',
        columnNames: ['deleted_at'],
      }),
    );

    await queryRunner.createIndex(
      'franchises',
      new TableIndex({
        name: 'idx_franchises_onboarded_at',
        columnNames: ['onboarded_at'],
      }),
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'franchises',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'franchises',
      new TableForeignKey({
        columnNames: ['updated_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'franchises',
      new TableForeignKey({
        columnNames: ['deleted_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('franchises');
  }
}
