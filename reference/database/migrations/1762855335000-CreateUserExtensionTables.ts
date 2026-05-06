import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateUserExtensionTables1762855335000
  implements MigrationInterface
{
  name = 'CreateUserExtensionTables1762855335000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_details table
    await queryRunner.createTable(
      new Table({
        name: 'user_details',
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
            isUnique: true,
          },
          {
            name: 'username',
            type: 'varchar',
            length: '100',
            isNullable: true,
            isUnique: true,
          },
          {
            name: 'gender',
            type: 'enum',
            enum: ['Male', 'Female', 'Other', 'PreferNotToSay'],
            isNullable: true,
          },
          {
            name: 'date_of_birth',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'bio',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'profile_picture',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'phone_verified_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'email_verified_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'timezone',
            type: 'varchar',
            length: '50',
            default: "'UTC'",
            isNullable: false,
          },
          {
            name: 'locale',
            type: 'varchar',
            length: '10',
            default: "'en_US'",
            isNullable: false,
          },
          {
            name: 'notification_preferences',
            type: 'jsonb',
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

    // Create indexes for user_details
    await queryRunner.createIndex(
      'user_details',
      new TableIndex({
        name: 'idx_user_details_user',
        columnNames: ['user_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'user_details',
      new TableIndex({
        name: 'idx_user_details_username',
        columnNames: ['username'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'user_details',
      new TableIndex({
        name: 'idx_user_details_phone',
        columnNames: ['phone'],
      }),
    );

    // Create foreign keys for user_details
    await queryRunner.createForeignKey(
      'user_details',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_details',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'user_details',
      new TableForeignKey({
        columnNames: ['updated_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'SET NULL',
      }),
    );

    // Create user_security table
    await queryRunner.createTable(
      new Table({
        name: 'user_security',
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
            isUnique: true,
          },
          {
            name: 'password_changed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'password_expires_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'require_password_change',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'failed_login_attempts',
            type: 'smallint',
            default: 0,
            isNullable: false,
          },
          {
            name: 'locked_until',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'last_login_ip',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'mfa_enabled',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'mfa_type',
            type: 'enum',
            enum: ['TOTP', 'SMS', 'Email', 'None'],
            default: "'None'",
            isNullable: false,
          },
          {
            name: 'mfa_secret',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'mfa_backup_codes',
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

    // Create indexes for user_security
    await queryRunner.createIndex(
      'user_security',
      new TableIndex({
        name: 'idx_user_security_user',
        columnNames: ['user_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'user_security',
      new TableIndex({
        name: 'idx_user_security_mfa',
        columnNames: ['mfa_enabled'],
      }),
    );

    await queryRunner.createIndex(
      'user_security',
      new TableIndex({
        name: 'idx_user_security_locked',
        columnNames: ['locked_until'],
      }),
    );

    // Create foreign keys for user_security
    await queryRunner.createForeignKey(
      'user_security',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_security',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'user_security',
      new TableForeignKey({
        columnNames: ['updated_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'SET NULL',
      }),
    );

    // Create password_history table
    await queryRunner.createTable(
      new Table({
        name: 'password_history',
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
            name: 'password_hash',
            type: 'varchar',
            length: '255',
            isNullable: false,
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

    // Create indexes for password_history
    await queryRunner.createIndex(
      'password_history',
      new TableIndex({
        name: 'idx_password_history_user',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'password_history',
      new TableIndex({
        name: 'idx_password_history_user_date',
        columnNames: ['user_id', 'created_at'],
      }),
    );

    // Create foreign key for password_history
    await queryRunner.createForeignKey(
      'password_history',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    );

    // Create password_reset_tokens table
    await queryRunner.createTable(
      new Table({
        name: 'password_reset_tokens',
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
            name: 'token',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'used_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'varchar',
            length: '500',
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

    // Create indexes for password_reset_tokens
    await queryRunner.createIndex(
      'password_reset_tokens',
      new TableIndex({
        name: 'idx_password_reset_token',
        columnNames: ['token'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'password_reset_tokens',
      new TableIndex({
        name: 'idx_password_reset_user',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'password_reset_tokens',
      new TableIndex({
        name: 'idx_password_reset_expires',
        columnNames: ['expires_at'],
      }),
    );

    await queryRunner.createIndex(
      'password_reset_tokens',
      new TableIndex({
        name: 'idx_password_reset_valid',
        columnNames: ['user_id', 'expires_at', 'used_at'],
      }),
    );

    // Create foreign key for password_reset_tokens
    await queryRunner.createForeignKey(
      'password_reset_tokens',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.dropTable('password_reset_tokens');
    await queryRunner.dropTable('password_history');
    await queryRunner.dropTable('user_security');
    await queryRunner.dropTable('user_details');
  }
}
