import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';
import { DomainException, BlockchainException } from '../exceptions/domain.exceptions';

/**
 * Global exception filter that handles all unhandled exceptions
 * and formats them in a consistent way
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    this.logException(exception, request);
    
    // Handle different types of exceptions
    if (exception instanceof DomainException) {
      return this.handleDomainException(exception, response, request);
    } else if (exception instanceof HttpException) {
      return this.handleHttpException(exception, response, request);
    } else if (exception instanceof QueryFailedError) {
      return this.handleDatabaseException(exception, response, request);
    } else if (exception instanceof EntityNotFoundError) {
      return this.handleEntityNotFoundException(exception, response, request);
    } else {
      return this.handleUnknownException(exception, response, request);
    }
  }

  private handleDomainException(
    exception: DomainException,
    response: Response,
    request: Request,
  ) {
    const status = exception.getStatus();
    const message = exception.message;
    
    let errorResponse: any = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      domain: exception.constructor.name.replace('Exception', ''),
    };
    
    // Add blockchain-specific fields if applicable
    if (exception instanceof BlockchainException) {
      if (exception.transactionHash) {
        errorResponse.transactionHash = exception.transactionHash;
      }
      if (exception.reason) {
        errorResponse.reason = exception.reason;
      }
    }

    return response.status(status).json(errorResponse);
  }

  private handleHttpException(
    exception: HttpException,
    response: Response,
    request: Request,
  ) {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    
    let errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (typeof exceptionResponse === 'object') {
      errorResponse = {
        ...errorResponse,
        ...(typeof exceptionResponse === 'object' ? exceptionResponse : { message: exceptionResponse }),
      };
    } else {
      errorResponse.message = exceptionResponse;
    }

    return response.status(status).json(errorResponse);
  }

  private handleDatabaseException(
    exception: QueryFailedError,
    response: Response,
    request: Request,
  ) {
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error occurred';
    
    // Categorize common database errors
    if (exception.message.includes('duplicate key')) {
      status = HttpStatus.CONFLICT;
      message = 'A record with the same data already exists';
    } else if (exception.message.includes('foreign key constraint')) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Operation would violate data integrity constraints';
    } else if (exception.message.includes('not-null constraint')) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Required data is missing';
    }

    const errorResponse = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: process.env.NODE_ENV === 'production' ? 'Database Error' : exception.message,
    };

    return response.status(status).json(errorResponse);
  }

  private handleEntityNotFoundException(
    exception: EntityNotFoundError,
    response: Response,
    request: Request,
  ) {
    const status = HttpStatus.NOT_FOUND;
    const errorResponse = {
      statusCode: status,
      message: 'Resource not found',
      timestamp: new Date().toISOString(),
      path: request.url,
      error: process.env.NODE_ENV === 'production' ? 'Not Found' : exception.message,
    };

    return response.status(status).json(errorResponse);
  }

  private handleUnknownException(
    exception: any,
    response: Response,
    request: Request,
  ) {
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    
    const errorResponse = {
      statusCode: status,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
      path: request.url,
      error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : exception.message,
    };

    return response.status(status).json(errorResponse);
  }
  
  private logException(exception: any, request: Request) {
    const user = request.user ? `(User ID: ${(request.user as any).id})` : '(Unauthenticated)';
    const method = request.method;
    const url = request.url;
    const userAgent = request.headers['user-agent'] || 'Unknown';
    const ip = request.ip;
    
    if (exception instanceof HttpException) {
      // For 4xx client errors, use log level warning
      if (exception.getStatus() >= 400 && exception.getStatus() < 500) {
        this.logger.warn(
          `Client Error ${exception.getStatus()}: ${exception.message} - ${method} ${url} - ${user} - ${ip} - ${userAgent}`,
          exception.stack,
        );
      } else {
        // For 5xx server errors, use log level error
        this.logger.error(
          `Server Error ${exception.getStatus()}: ${exception.message} - ${method} ${url} - ${user} - ${ip} - ${userAgent}`,
          exception.stack,
        );
      }
    } else {
      // For unknown errors, always use log level error
      const errorMessage = exception instanceof Error ? exception.message : 'Unknown error';
      const stack = exception instanceof Error ? exception.stack : '';
      
      this.logger.error(
        `Unexpected Error: ${errorMessage} - ${method} ${url} - ${user} - ${ip} - ${userAgent}`,
        stack,
      );
    }
  }
}