import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateRatingTemplates1769279492598 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create rating_templates table
    await queryRunner.createTable(
      new Table({
        name: 'rating_templates',
        columns: [
          {
            name: 'id',
            type: 'int',
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
            name: 'code',
            type: 'varchar',
            length: '100',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'rating_type',
            type: 'enum',
            enum: ['stars', 'scale', 'thumbs', 'percentage'],
            default: "'stars'",
            isNullable: false,
          },
          {
            name: 'min_value',
            type: 'int',
            default: 1,
            isNullable: false,
          },
          {
            name: 'max_value',
            type: 'int',
            default: 5,
            isNullable: false,
          },
          {
            name: 'is_required',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'sequence_order',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'Active'",
            isNullable: false,
          },
          {
            name: 'created_by',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_by',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_by',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['created_by'],
            referencedTableName: 'user',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
            name: 'FK_rating_templates_created_by',
          },
          {
            columnNames: ['updated_by'],
            referencedTableName: 'user',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
            name: 'FK_rating_templates_updated_by',
          },
          {
            columnNames: ['deleted_by'],
            referencedTableName: 'user',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
            name: 'FK_rating_templates_deleted_by',
          },
        ],
      }),
      true,
    );

    // Create index on is_active
    await queryRunner.createIndex(
      'rating_templates',
      new TableIndex({
        name: 'IDX_rating_templates_is_active',
        columnNames: ['is_active'],
      }),
    );

    // Create index on deleted_at
    await queryRunner.createIndex(
      'rating_templates',
      new TableIndex({
        name: 'IDX_rating_templates_deleted_at',
        columnNames: ['deleted_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('rating_templates', true, true);
  }
}
