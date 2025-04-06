import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import * as httpMocks from 'node-mocks-http';
import { BatchResponseItem } from './batch.controller';
import { Session } from 'express-session';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

// Declare RequestWithSession properly - create a new interface rather than extending
interface RequestWithSession {
  session?: Session & { 
    [key: string]: any;
  };
  cookies?: Record<string, any>;
  headers: Record<string, string | string[] | undefined>;
  user?: any;
  method?: string;
  url?: string;
  query?: any;
  body?: any;
}

// Interface for batch requests
interface BatchRequestItem {
  id: string;
  method: string;
  path: string;
  body?: any;
  query?: any;
  headers?: Record<string, string>;
}

@Injectable()
export class BatchService {
  private readonly logger = new Logger(BatchService.name);
  private readonly maxBatchSize = 20; // Maximum number of requests in a batch
  private readonly allowedPaths = new Set<string>(); // Empty set means all paths are allowed by default
  private readonly deniedPaths = new Set<string>([
    '/api/batch', // Prevent nested batch requests
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/auth/logout',
    '/auth/reset-password',
    '/uploads', // Prevent file uploads via batch
  ]);
  
  constructor() {}

  /**
   * Execute a batch of API requests
   * @param requests Array of request objects
   * @param originalRequest Original request for auth context
   */
  async executeBatch(
    requests: BatchRequestItem[],
    originalRequest: Request,
  ): Promise<BatchResponseItem[]> {
    // Security check for batch size
    if (requests.length > this.maxBatchSize) {
      throw new HttpException(
        `Batch size exceeds maximum allowed (${this.maxBatchSize})`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Security checks for each request
    for (const request of requests) {
      if (this.isDeniedPath(request.path)) {
        throw new HttpException(
          `Path '${request.path}' is not allowed in batch requests`,
          HttpStatus.FORBIDDEN,
        );
      }

      if (this.allowedPaths.size > 0 && !this.isAllowedPath(request.path)) {
        throw new HttpException(
          `Path '${request.path}' is not allowed in batch requests`,
          HttpStatus.FORBIDDEN,
        );
      }

      // Normalize path
      if (!request.path.startsWith('/')) {
        request.path = '/' + request.path;
      }
    }

    // Track metrics
    const startTime = Date.now();
    this.logger.log(`Starting batch of ${requests.length} requests`);

    // Execute requests in parallel with a limit of 5 concurrent requests
    const responses = await this.executeRequestsWithConcurrencyLimit(requests, originalRequest, 5);

    // Log metrics
    const duration = Date.now() - startTime;
    this.logger.log(`Completed batch of ${requests.length} requests in ${duration}ms`);

    return responses;
  }

  /**
   * Execute requests with a concurrency limit
   * @param requests Array of request objects
   * @param originalRequest Original request for auth context
   * @param concurrencyLimit Maximum number of concurrent requests
   */
  private async executeRequestsWithConcurrencyLimit(
    requests: BatchRequestItem[],
    originalRequest: Request,
    concurrencyLimit: number,
  ): Promise<BatchResponseItem[]> {
    const results: BatchResponseItem[] = new Array(requests.length);
    let activeCount = 0;
    let nextIndex = 0;

    return new Promise((resolve) => {
      // Function to process the next request
      const processNext = async () => {
        if (nextIndex >= requests.length) {
          // If we've processed all requests and none are active, we're done
          if (activeCount === 0) {
            resolve(results);
          }
          return;
        }

        // Get the next request to process
        const index = nextIndex++;
        const request = requests[index];

        // Track active count
        activeCount++;

        try {
          // Execute the request
          const response = await this.executeRequest(request, originalRequest);
          results[index] = response;
        } catch (error) {
          // Handle request failure
          results[index] = {
            id: request.id,
            status: error.status || 500,
            headers: {},
            body: {
              message: error.message || 'Internal server error',
              error: error.name || 'Error',
            },
          };
          this.logger.error(`Error executing batch request: ${error.message}`);
        }

        // Decrement active count
        activeCount--;

        // Try to process the next request
        processNext();
      };

      // Start initial batch of requests up to concurrency limit
      for (let i = 0; i < Math.min(concurrencyLimit, requests.length); i++) {
        processNext();
      }
    });
  }

  /**
   * Execute a single API request within the batch
   * @param request Request object
   * @param originalRequest Original request for auth context
   */
  private async executeRequest(
    request: BatchRequestItem,
    originalRequest: Request,
  ): Promise<BatchResponseItem> {
    try {
      // Create mock request and response objects
      const mockRequest = httpMocks.createRequest({
        method: request.method as any, // Cast to any to avoid type error
        url: request.path,
        query: request.query || {},
        body: request.body || {},
        headers: {
          ...this.getForwardedHeaders(originalRequest),
          ...(request.headers || {}),
        },
        // Forward important session and auth info
        cookies: originalRequest.cookies,
        session: (originalRequest as any).session,
      });

      // For auth purposes, copy the user object from the original request
      if ((originalRequest as any)['user']) {
        mockRequest['user'] = (originalRequest as any)['user'];
      }

      // Forward the JWT token if present
      const authHeader = originalRequest.headers.authorization;
      if (authHeader) {
        mockRequest.headers.authorization = authHeader;
      }

      const mockResponse = httpMocks.createResponse();

      // TODO: This is where you'd normally dispatch to the appropriate controller
      // For now, we'll just use a placeholder implementation
      mockResponse.status(200).json({
        message: 'This is a placeholder implementation',
        request: {
          method: request.method,
          path: request.path,
        }
      });

      // Extract response data
      return {
        id: request.id,
        status: mockResponse._getStatusCode(),
        headers: mockResponse._getHeaders() as Record<string, string>, // Cast to correct type
        body: mockResponse._getData(),
      };
    } catch (error) {
      this.logger.error(`Error executing request: ${error.message}`);
      
      return {
        id: request.id,
        status: error.status || 500,
        headers: {},
        body: {
          message: error.message || 'Internal server error',
          error: error.name || 'Error',
        },
      };
    }
  }

  /**
   * Check if a path is explicitly allowed
   * @param path Request path
   */
  private isAllowedPath(path: string): boolean {
    // If no allowed paths specified, all non-denied paths are allowed
    if (this.allowedPaths.size === 0) {
      return true;
    }
    
    // Check if path is in allowed list
    return Array.from(this.allowedPaths).some(allowedPath => {
      return path.startsWith(allowedPath);
    });
  }

  /**
   * Check if a path is denied
   * @param path Request path
   */
  private isDeniedPath(path: string): boolean {
    return Array.from(this.deniedPaths).some(deniedPath => {
      return path.startsWith(deniedPath);
    });
  }

  /**
   * Get headers that should be forwarded from the original request
   * @param req Original request
   */
  private getForwardedHeaders(req: Request): Record<string, string> {
    const headers: Record<string, string> = {};
    
    // Forward common headers
    const headersToForward = [
      'authorization',
      'content-type',
      'accept',
      'accept-language',
      'user-agent',
      'x-forwarded-for',
      'x-real-ip',
    ];

    headersToForward.forEach(header => {
      const headerValue = req.headers[header];
      if (headerValue) {
        // Convert array headers to string
        headers[header] = Array.isArray(headerValue) 
          ? headerValue.join(', ') 
          : headerValue.toString();
      }
    });

    return headers;
  }
}