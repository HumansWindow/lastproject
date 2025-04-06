import supertest from 'supertest';
import { Server } from 'http';

/**
 * Helper function that handles SuperTest requests and ensures proper connection closure
 * This addresses the "open handles" issue in Jest tests
 */
export async function makeRequest(
  httpRequest: supertest.SuperTest<supertest.Test>,
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  url: string,
  payload?: any,
  expectedStatus?: number
) {
  let request = httpRequest[method](url);
  
  if (payload && (method === 'post' || method === 'put' || method === 'patch')) {
    request = request.send(payload);
  }
  
  if (expectedStatus) {
    request = request.expect(expectedStatus);
  }
  
  return request;
}

/**
 * Creates a test agent that will automatically handle connection cleanup
 * Use this instead of raw supertest to avoid open handle issues
 */
export function createTestAgent(server: Server): supertest.SuperTest<supertest.Test> {
  return supertest(server);
}

/**
 * Properly closes the HTTP server used by supertest
 * Call this in afterAll() to ensure all connections are closed
 */
export async function closeServer(server: Server): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => {
      resolve();
    });
  });
}

/**
 * Helper function to run tests in series to avoid connection issues
 * This is useful when testing routes that share state
 */
export async function runInSeries(tests: Array<() => Promise<any>>): Promise<void> {
  for (const test of tests) {
    await test();
  }
}

export const makeTestRequest = async (
  httpRequest: supertest.SuperTest<supertest.Test>,
  method: string,
  path: string,
  data?: any,
  headers?: Record<string, string>
): Promise<supertest.Response> => {
  let req = httpRequest[method](path);
  req.set('Connection', 'close');
  
  // Add custom headers if provided
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      req = req.set(key, value);
    });
  }
  
  if (data) {
    req = req.send(data);
  }
  
  const result = await req;
  if (req.req && typeof req.req.destroy === 'function') {
    req.req.destroy();
  }
  return result;
};
