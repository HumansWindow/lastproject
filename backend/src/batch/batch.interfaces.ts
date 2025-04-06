/**
 * Shared interfaces for the batch module
 */

// Interface for batch request items
export interface BatchRequestItem {
  id: string;
  method: string;
  path: string;
  body?: any;
  query?: any;
  headers?: Record<string, string>;
}

// Interface for batch response items
export interface BatchResponseItem {
  id: string;
  status: number;
  headers: Record<string, string>;
  body: any;
}