import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddProfilePicturePathToUserDetails1764700000000
  implements MigrationInterface
{
  name = 'AddProfilePicturePathToUserDetails1764700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'user_details',
      new TableColumn({
        name: 'profile_picture_path',
        type: 'varchar',
        length: '255',
        isNullable: true,
        comment: 'Storage key/path for the profile picture (internal use)',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user_details', 'profile_picture_path');
  }
}
