import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFormTemplatesTables1769178182144
  implements MigrationInterface
{
  name = 'CreateFormTemplatesTables1769178182144';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create form_templates table
    await queryRunner.query(`
      CREATE TABLE form_templates (
        id SERIAL PRIMARY KEY,
        service_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(100) NOT NULL,
        field_type VARCHAR(50) NOT NULL DEFAULT 'text',
        is_required BOOLEAN NOT NULL DEFAULT false,
        placeholder VARCHAR(255),
        help_text TEXT,
        default_value VARCHAR(255),
        sequence_order INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_by INT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_by INT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_by INT,
        deleted_at TIMESTAMPTZ,
        CONSTRAINT fk_form_templates_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
        CONSTRAINT fk_form_templates_created_by FOREIGN KEY (created_by) REFERENCES "user"(id),
        CONSTRAINT fk_form_templates_updated_by FOREIGN KEY (updated_by) REFERENCES "user"(id),
        CONSTRAINT fk_form_templates_deleted_by FOREIGN KEY (deleted_by) REFERENCES "user"(id),
        CONSTRAINT uq_form_templates_service_code UNIQUE (service_id, code)
      )
    `);

    // Create indexes for form_templates
    await queryRunner.query(`
      CREATE INDEX idx_form_templates_service_id ON form_templates(service_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_form_templates_is_active ON form_templates(is_active)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_form_templates_deleted_at ON form_templates(deleted_at)
    `);

    // Create form_template_validation_rules table
    await queryRunner.query(`
      CREATE TABLE form_template_validation_rules (
        id SERIAL PRIMARY KEY,
        form_template_id INT NOT NULL,
        rule_type VARCHAR(50) NOT NULL,
        rule_value VARCHAR(255) NOT NULL,
        error_message VARCHAR(500),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_validation_rules_template FOREIGN KEY (form_template_id) REFERENCES form_templates(id) ON DELETE CASCADE
      )
    `);

    // Create index for form_template_validation_rules
    await queryRunner.query(`
      CREATE INDEX idx_form_template_validation_rules_template_id ON form_template_validation_rules(form_template_id)
    `);

    // Create form_template_options table
    await queryRunner.query(`
      CREATE TABLE form_template_options (
        id SERIAL PRIMARY KEY,
        form_template_id INT NOT NULL,
        label VARCHAR(255) NOT NULL,
        value VARCHAR(255) NOT NULL,
        sequence_order INT NOT NULL DEFAULT 0,
        is_default BOOLEAN NOT NULL DEFAULT false,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_options_template FOREIGN KEY (form_template_id) REFERENCES form_templates(id) ON DELETE CASCADE
      )
    `);

    // Create index for form_template_options
    await queryRunner.query(`
      CREATE INDEX idx_form_template_options_template_id ON form_template_options(form_template_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order (due to foreign key constraints)
    await queryRunner.query(`DROP TABLE IF EXISTS form_template_options`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS form_template_validation_rules`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS form_templates`);
  }
}
