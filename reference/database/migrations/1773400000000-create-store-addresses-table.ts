import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateStoreAddressesTable1773400000000
  implements MigrationInterface
{
  name = 'CreateStoreAddressesTable1773400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'store_addresses',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'seller_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'label',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'address_line',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'province',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'city',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'barangay',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'postal_code',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'latitude',
            type: 'decimal',
            precision: 10,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'longitude',
            type: 'decimal',
            precision: 11,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'is_default',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'created_by',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_by',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'deleted_by',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'store_addresses',
      new TableIndex({
        name: 'idx_store_addresses_seller_id',
        columnNames: ['seller_id'],
      }),
    );

    await queryRunner.createIndex(
      'store_addresses',
      new TableIndex({
        name: 'idx_store_addresses_is_default',
        columnNames: ['is_default'],
      }),
    );

    await queryRunner.createForeignKey(
      'store_addresses',
      new TableForeignKey({
        name: 'fk_store_addresses_seller_id',
        columnNames: ['seller_id'],
        referencedTableName: 'sellers',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'store_addresses',
      new TableForeignKey({
        name: 'fk_store_addresses_created_by',
        columnNames: ['created_by'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'store_addresses',
      new TableForeignKey({
        name: 'fk_store_addresses_updated_by',
        columnNames: ['updated_by'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'store_addresses',
      new TableForeignKey({
        name: 'fk_store_addresses_deleted_by',
        columnNames: ['deleted_by'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('store_addresses', true, true, true);
  }
}
