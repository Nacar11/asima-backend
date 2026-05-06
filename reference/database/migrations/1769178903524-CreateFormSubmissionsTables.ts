import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFormSubmissionsTables1769178903524
  implements MigrationInterface
{
  name = 'CreateFormSubmissionsTables1769178903524';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create form_submissions table
    await queryRunner.query(`
      CREATE TABLE form_submissions (
        id SERIAL PRIMARY KEY,
        service_id INT NOT NULL,
        customer_id INT NOT NULL,
        booking_id INT,
        quotation_id INT,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        CONSTRAINT fk_form_submissions_service FOREIGN KEY (service_id) REFERENCES services(id),
        CONSTRAINT fk_form_submissions_customer FOREIGN KEY (customer_id) REFERENCES "user"(id),
        CONSTRAINT fk_form_submissions_booking FOREIGN KEY (booking_id) REFERENCES bookings(id)
      )
    `);

    // Create indexes for form_submissions
    await queryRunner.query(`
      CREATE INDEX idx_form_submissions_service_id ON form_submissions(service_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_form_submissions_customer_id ON form_submissions(customer_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_form_submissions_booking_id ON form_submissions(booking_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_form_submissions_quotation_id ON form_submissions(quotation_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_form_submissions_deleted_at ON form_submissions(deleted_at)
    `);

    // Create form_submission_values table
    await queryRunner.query(`
      CREATE TABLE form_submission_values (
        id SERIAL PRIMARY KEY,
        form_submission_id INT NOT NULL,
        form_template_id INT NOT NULL,
        field_code VARCHAR(100) NOT NULL,
        field_name VARCHAR(255) NOT NULL,
        field_type VARCHAR(50) NOT NULL,
        value TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_submission_values_submission FOREIGN KEY (form_submission_id) REFERENCES form_submissions(id) ON DELETE CASCADE,
        CONSTRAINT fk_submission_values_template FOREIGN KEY (form_template_id) REFERENCES form_templates(id)
      )
    `);

    // Create indexes for form_submission_values
    await queryRunner.query(`
      CREATE INDEX idx_form_submission_values_submission_id ON form_submission_values(form_submission_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_form_submission_values_field_code ON form_submission_values(field_code)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order (due to foreign key constraints)
    await queryRunner.query(`DROP TABLE IF EXISTS form_submission_values`);
    await queryRunner.query(`DROP TABLE IF EXISTS form_submissions`);
  }
}
