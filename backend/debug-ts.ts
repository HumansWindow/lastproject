// This file is used to test basic TypeScript compilation
import 'reflect-metadata';

// Basic test of TypeScript features
class TestClass {
  private name: string;
  
  constructor(name: string) {
    this.name = name;
  }

  @logMethod
  getName(): string {
    return this.name;
  }
}

// Test decorator - fixed signature
function logMethod(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  descriptor.value = function(...args: any[]) {
    console.log(`Calling ${propertyKey}`);
    return originalMethod.apply(this, args);
  };
  return descriptor;
}

async function main() {
  console.log('TypeScript compilation test successful');
  const test = new TestClass('Test');
  console.log(test.getName());
}

main().catch(error => {
  console.error('TypeScript test failed:', error);
  process.exit(1);
});
