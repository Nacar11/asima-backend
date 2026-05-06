import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class AddOtpToPasswordResetTokens1762916000000
  implements MigrationInterface
{
  name = 'AddOtpToPasswordResetTokens1762916000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add OTP column to password_reset_tokens table
    await queryRunner.addColumn(
      'password_reset_tokens',
      new TableColumn({
        name: 'otp',
        type: 'varchar',
        length: '6',
        isNullable: true,
      }),
    );

    // Add index for OTP lookups using TypeORM API
    await queryRunner.createIndex(
      'password_reset_tokens',
      new TableIndex({
        name: 'idx_password_reset_otp',
        columnNames: ['otp'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index using TypeORM API
    await queryRunner.dropIndex(
      'password_reset_tokens',
      'idx_password_reset_otp',
    );

    // Drop OTP column
    await queryRunner.dropColumn('password_reset_tokens', 'otp');
  }
}
