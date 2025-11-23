import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    // Handle HTTP exceptions (thrown by NestJS validators, guards, etc.)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string' 
        ? exceptionResponse 
        : (exceptionResponse as any).message || message;
      error = exception.name;
    } 
    // Handle RPC/gRPC exceptions (from microservices)
    else if (exception.error || exception.code) {
      const grpcStatusMap: Record<number, number> = {
        1: 499,  // CANCELLED
        2: 500,  // UNKNOWN
        3: 400,  // INVALID_ARGUMENT
        4: 504,  // DEADLINE_EXCEEDED
        5: 404,  // NOT_FOUND
        6: 409,  // ALREADY_EXISTS
        7: 403,  // PERMISSION_DENIED
        8: 429,  // RESOURCE_EXHAUSTED
        9: 412,  // FAILED_PRECONDITION
        10: 409, // ABORTED
        11: 400, // OUT_OF_RANGE
        12: 501, // UNIMPLEMENTED
        13: 500, // INTERNAL
        14: 503, // UNAVAILABLE
        15: 500, // DATA_LOSS
        16: 401, // UNAUTHENTICATED
      };

      status = grpcStatusMap[exception.code] || 500;
      message = exception.details || exception.message || 'Microservice error';
      error = 'Microservice Error';
    }
    // Handle validation errors
    else if (exception.response?.message && Array.isArray(exception.response.message)) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.response.message.join(', ');
      error = 'Validation Error';
    }
    // Handle generic errors
    else {
      message = exception.message || message;
      error = exception.name || error;
    }

    // Log the error with full context
    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - Message: ${message}`,
      exception.stack
    );

    // Send standardized error response
    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}