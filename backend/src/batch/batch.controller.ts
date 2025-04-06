import { Controller, Post, Body, HttpException, Req, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import * as httpMocks from 'node-mocks-http';
import { BatchService } from './batch.service';
import { Session } from 'express-session';

// Type definitions for batch request/response
interface BatchRequestItem {
  id: string;
  method: string;
  path: string;
  body?: any;
  query?: any;
  headers?: Record<string, string>;
}

export interface BatchResponseItem {
  id: string;
  status: number;
  headers: Record<string, string>;
  body: any;
}

@ApiTags('batch')
@Controller('api/batch')
export class BatchController {
  private readonly logger = new Logger(BatchController.name);
  
  constructor(private readonly batchService: BatchService) {}
  
  @Post()
  @ApiOperation({ summary: 'Execute multiple API requests in a single batch' })
  @ApiBody({
    description: 'Array of requests to execute in batch',
    type: 'array',
    isArray: true
  })
  @ApiResponse({
    status: 200,
    description: 'Batch executed successfully',
    type: Array
  })
  async executeBatch(@Body() batchRequests: BatchRequestItem[], @Req() request: Request): Promise<BatchResponseItem[]> {
    // Validate batch request
    if (!Array.isArray(batchRequests)) {
      throw new HttpException('Invalid batch request format', HttpStatus.BAD_REQUEST);
    }
    
    if (batchRequests.length === 0) {
      return [];
    }
    
    // Log batch request
    this.logger.log(`Processing batch of ${batchRequests.length} requests`);
    
    // Make sure each request has an ID
    batchRequests.forEach(req => {
      if (!req.id) {
        req.id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      }
    });
    
    // Execute batch requests
    return this.batchService.executeBatch(batchRequests, request);
  }
}