/// <reference types="jest" />
/// <reference types="@types/express-serve-static-core" />

// This file adds global type definitions for Jest testing in TypeScript

// Add Express multer typings for file uploads in tests
declare namespace Express {
  namespace Multer {
    interface File {
      /** Field name specified in the form */
      fieldname: string;
      /** Name of the file on the user's computer */
      originalname: string;
      /** Encoding type of the file */
      encoding: string;
      /** Mime type of the file */
      mimetype: string;
      /** Size of the file in bytes */
      size: number;
      /** The folder to which the file has been saved (DiskStorage) */
      destination?: string;
      /** The name of the file within the destination (DiskStorage) */
      filename?: string;
      /** Location of the uploaded file (DiskStorage) */
      path?: string;
      /** A Buffer of the entire file (MemoryStorage) */
      buffer?: Buffer;
    }
  }
}

// No need to declare the Jest globals as they're already defined in @types/jest
// We'll just re-export the module to ensure it's loaded

export {};