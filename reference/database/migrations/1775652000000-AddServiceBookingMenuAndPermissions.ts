import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServiceBookingMenuAndPermissions1775652000000
  implements MigrationInterface
{
  name = 'AddServiceBookingMenuAndPermissions1775652000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      WITH admin_user AS (
        SELECT id
        FROM "user"
        WHERE system_admin = true
        ORDER BY id
        LIMIT 1
      )
      INSERT INTO menus (
        menu_code,
        menu_name,
        permissions,
        status,
        created_at,
        updated_at,
        created_by,
        updated_by
      )
      SELECT
        'SM16',
        'SERVICE BOOKING',
        ARRAY['View','Create','Edit','Delete','Endorse','Review','Approve','Upload']::text[],
        'Active',
        NOW(),
        NOW(),
        admin_user.id,
        admin_user.id
      FROM admin_user
      WHERE NOT EXISTS (
        SELECT 1
        FROM menus
        WHERE menu_code = 'SM16'
      );
    `);

    await queryRunner.query(`
      WITH admin_user AS (
        SELECT id
        FROM "user"
        WHERE system_admin = true
        ORDER BY id
        LIMIT 1
      ),
      target_groups AS (
        SELECT id
        FROM user_groups
        WHERE group_name IN ('Admin', 'Store Owner')
          AND seller_id IS NULL
          AND deleted_at IS NULL
      ),
      sm16_menu AS (
        SELECT id
        FROM menus
        WHERE menu_code = 'SM16'
          AND deleted_at IS NULL
        ORDER BY id
        LIMIT 1
      )
      INSERT INTO user_permissions (
        group_id,
        menu_id,
        permissions,
        status,
        created_at,
        updated_at,
        created_by,
        updated_by
      )
      SELECT
        g.id,
        m.id,
        ARRAY['View','Create','Edit','Delete','Endorse','Review','Approve','Upload']::text[],
        'Active',
        NOW(),
        NOW(),
        a.id,
        a.id
      FROM admin_user a
      CROSS JOIN target_groups g
      CROSS JOIN sm16_menu m
      WHERE NOT EXISTS (
        SELECT 1
        FROM user_permissions up
        WHERE up.group_id = g.id
          AND up.menu_id = m.id
          AND up.deleted_at IS NULL
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM user_permissions
      WHERE menu_id IN (
        SELECT id
        FROM menus
        WHERE menu_code = 'SM16'
      )
      AND group_id IN (
        SELECT id
        FROM user_groups
        WHERE group_name IN ('Admin', 'Store Owner')
          AND seller_id IS NULL
      );
    `);

    await queryRunner.query(`
      DELETE FROM menus
      WHERE menu_code = 'SM16'
        AND NOT EXISTS (
          SELECT 1
          FROM user_permissions up
          WHERE up.menu_id = menus.id
        );
    `);
  }
}
