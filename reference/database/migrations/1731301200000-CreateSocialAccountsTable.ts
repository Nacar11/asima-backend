import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateSocialAccountsTable1731301200000
  implements MigrationInterface
{
  name = 'CreateSocialAccountsTable1731301200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'social_account',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'provider',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'provider_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'access_token',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'refresh_token',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'token_expires_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'profile_data',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'is_verified',
            type: 'boolean',
            default: true,
            isNullable: false,
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
          {
            name: 'updated_by',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'updated_at',
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
      'social_account',
      new TableIndex({
        name: 'idx_social_accounts_user',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'social_account',
      new TableIndex({
        name: 'idx_social_accounts_provider',
        columnNames: ['provider', 'provider_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'social_account',
      new TableIndex({
        name: 'idx_social_accounts_provider_type',
        columnNames: ['provider'],
      }),
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'social_account',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'social_account',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'social_account',
      new TableForeignKey({
        columnNames: ['updated_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('social_account');
  }
}
