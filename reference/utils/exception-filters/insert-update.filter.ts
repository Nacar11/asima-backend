import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  applyDecorators,
  UseFilters,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
class InsertUpdateFailed implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    let message = (exception as any).message.message;
    let error = 'Internal Server Error';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    switch (exception.constructor) {
      case QueryFailedError: // this is a TypeOrm error
        status = HttpStatus.UNPROCESSABLE_ENTITY;
        message = (exception as QueryFailedError)['detail'];
        error = 'Unprocessable Entity';
        break;
      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
    });
  }
}

export const InsertUpdateFailedFilter = () =>
  applyDecorators(UseFilters(new InsertUpdateFailed()));
