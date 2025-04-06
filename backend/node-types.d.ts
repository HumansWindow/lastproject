/// <reference types="node" />

// This file exists to help TypeScript find the Node.js type definitions
declare namespace NodeJS {
  // Just enough to make TypeScript recognize this as a proper declaration file
  interface Process {
    env: ProcessEnv;
  }

  interface ProcessEnv {
    [key: string]: string | undefined;
  }
}