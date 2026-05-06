import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Exception thrown when a product is being published without required core fields
 */
export class ProductPublishValidationException extends HttpException {
  constructor(missingFields: string[]) {
    const message = `Product cannot be Published. Missing core requirements: ${missingFields.join(', ')}`;
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: 'ProductPublishValidationException',
        missingFields,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
