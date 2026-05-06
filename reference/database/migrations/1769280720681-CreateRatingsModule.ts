import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateRatingsModule1769280720681 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ratings table
    await queryRunner.createTable(
      new Table({
        name: 'ratings',
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
            name: 'sales_order_id',
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
            name: 'service_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'overall_rating',
            type: 'decimal',
            precision: 3,
            scale: 2,
            default: 0,
          },
          {
            name: 'review_comment',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_public',
            type: 'boolean',
            default: true,
          },
          {
            name: 'has_seller_response',
            type: 'boolean',
            default: false,
          },
          {
            name: 'seller_response',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'seller_response_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'Active'",
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
      }),
      true,
    );

    // Create indexes for ratings
    await queryRunner.createIndex(
      'ratings',
      new TableIndex({
        name: 'IDX_ratings_booking_id',
        columnNames: ['booking_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'ratings',
      new TableIndex({
        name: 'IDX_ratings_customer_id',
        columnNames: ['customer_id'],
      }),
    );

    await queryRunner.createIndex(
      'ratings',
      new TableIndex({
        name: 'IDX_ratings_seller_id',
        columnNames: ['seller_id'],
      }),
    );

    await queryRunner.createIndex(
      'ratings',
      new TableIndex({
        name: 'IDX_ratings_sales_order_id',
        columnNames: ['sales_order_id'],
      }),
    );

    await queryRunner.createIndex(
      'ratings',
      new TableIndex({
        name: 'IDX_ratings_deleted_at',
        columnNames: ['deleted_at'],
      }),
    );

    // Create foreign keys for ratings
    await queryRunner.createForeignKey(
      'ratings',
      new TableForeignKey({
        name: 'FK_ratings_booking_id',
        columnNames: ['booking_id'],
        referencedTableName: 'bookings',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'ratings',
      new TableForeignKey({
        name: 'FK_ratings_sales_order_id',
        columnNames: ['sales_order_id'],
        referencedTableName: 'sales_orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'ratings',
      new TableForeignKey({
        name: 'FK_ratings_customer_id',
        columnNames: ['customer_id'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'ratings',
      new TableForeignKey({
        name: 'FK_ratings_seller_id',
        columnNames: ['seller_id'],
        referencedTableName: 'sellers',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'ratings',
      new TableForeignKey({
        name: 'FK_ratings_service_id',
        columnNames: ['service_id'],
        referencedTableName: 'services',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'ratings',
      new TableForeignKey({
        name: 'FK_ratings_created_by',
        columnNames: ['created_by'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'ratings',
      new TableForeignKey({
        name: 'FK_ratings_updated_by',
        columnNames: ['updated_by'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'ratings',
      new TableForeignKey({
        name: 'FK_ratings_deleted_by',
        columnNames: ['deleted_by'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Create rating_items table
    await queryRunner.createTable(
      new Table({
        name: 'rating_items',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'rating_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'rating_template_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'template_code',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'template_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'value',
            type: 'decimal',
            precision: 5,
            scale: 2,
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
      }),
      true,
    );

    // Create indexes for rating_items
    await queryRunner.createIndex(
      'rating_items',
      new TableIndex({
        name: 'IDX_rating_items_rating_id',
        columnNames: ['rating_id'],
      }),
    );

    await queryRunner.createIndex(
      'rating_items',
      new TableIndex({
        name: 'IDX_rating_items_rating_template_id',
        columnNames: ['rating_template_id'],
      }),
    );

    await queryRunner.createIndex(
      'rating_items',
      new TableIndex({
        name: 'IDX_rating_items_deleted_at',
        columnNames: ['deleted_at'],
      }),
    );

    // Create foreign keys for rating_items
    await queryRunner.createForeignKey(
      'rating_items',
      new TableForeignKey({
        name: 'FK_rating_items_rating_id',
        columnNames: ['rating_id'],
        referencedTableName: 'ratings',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'rating_items',
      new TableForeignKey({
        name: 'FK_rating_items_rating_template_id',
        columnNames: ['rating_template_id'],
        referencedTableName: 'rating_templates',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'rating_items',
      new TableForeignKey({
        name: 'FK_rating_items_created_by',
        columnNames: ['created_by'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'rating_items',
      new TableForeignKey({
        name: 'FK_rating_items_updated_by',
        columnNames: ['updated_by'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'rating_items',
      new TableForeignKey({
        name: 'FK_rating_items_deleted_by',
        columnNames: ['deleted_by'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('rating_items', true, true);
    await queryRunner.dropTable('ratings', true, true);
  }
}
