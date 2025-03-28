#!/bin/bash

# This script runs the tests with proper configuration

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Run the basic test that doesn't require complex mocking
echo "Running basic hotwallet tests..."
NODE_ENV=test NODE_OPTIONS=--experimental-vm-modules npx jest --config jest.config.js 'src/__tests__/blockchain/hotwallet-basic.spec.ts'

# Exit with the status of the test command
exit $?
