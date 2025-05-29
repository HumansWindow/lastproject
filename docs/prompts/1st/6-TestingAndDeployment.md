# Testing and Deployment Implementation Prompts

## Testing Strategy Setup

```prompt
Create a comprehensive testing strategy for a monorepo project with NestJS backend, Next.js frontend, admin dashboard, and React Native mobile application:

1. Unit testing setup:
   - Jest configuration for each package
   - Testing utilities and helpers
   - Mock providers and factories
   - Code coverage reporting

2. Integration testing:
   - API integration tests for backend
   - Component integration tests for frontend
   - Database integration testing
   - Authentication flow testing

3. End-to-end testing:
   - Cypress or Playwright setup for web applications
   - Detox setup for mobile application
   - Testing critical user journeys
   - Visual regression testing

4. Testing automation:
   - CI/CD integration for test running
   - Pre-commit hooks for local testing
   - Pull request validation
   - Performance testing configuration

5. Documentation:
   - Testing standards documentation
   - Test case writing guidelines
   - Coverage expectations
   - Mocking patterns
```

## Continuous Integration Setup

```prompt
Create a continuous integration configuration for a monorepo project using GitHub Actions:

1. CI workflows:
   - Pull request validation workflow
   - Main branch verification workflow
   - Scheduled health check workflow
   - Release preparation workflow

2. CI steps for each package:
   - Dependency installation with caching
   - Linting and static analysis
   - Unit tests with coverage reporting
   - Build verification
   - Integration tests
   - End-to-end tests

3. Optimization features:
   - Parallel job execution
   - Selective testing based on changed files
   - Dependency caching
   - Test splitting for faster execution

4. Quality gates:
   - Code coverage thresholds
   - Performance benchmarks
   - Security scanning
   - Accessibility testing

5. Reporting:
   - Test result reporting
   - Coverage reporting
   - Build artifact storage
   - Status notifications
```

## Deployment Pipeline Configuration

```prompt
Create a deployment pipeline configuration for a monorepo project:

1. Environment configuration:
   - Development environment setup
   - Staging environment setup
   - Production environment setup
   - Environment-specific configurations

2. Deployment workflows:
   - Staging deployment workflow
   - Production deployment workflow
   - Rollback procedures
   - Blue/green deployment strategy

3. Infrastructure management:
   - Infrastructure as Code setup (Terraform or AWS CDK)
   - Resource provisioning automation
   - Scaling configurations
   - Security group management

4. Container orchestration:
   - Kubernetes configurations
   - Helm charts for services
   - Service mesh setup
   - Auto-scaling policies

5. Monitoring and alerting:
   - Prometheus and Grafana setup
   - Alert configuration
   - Log aggregation
   - Performance monitoring
```

## Database Migration Strategy

```prompt
Create a database migration and versioning strategy for a monorepo project:

1. Migration system:
   - TypeORM migration configuration
   - Migration generation workflow
   - Migration testing process
   - Rollback strategies

2. Version control:
   - Migration versioning conventions
   - Schema versioning approach
   - Database change documentation
   - Migration history tracking

3. Deployment considerations:
   - Zero-downtime migration strategies
   - Large dataset migration handling
   - Data integrity verification
   - Performance impact assessment

4. Database maintenance:
   - Index optimization procedures
   - Database health checks
   - Backup and restore procedures
   - Data archiving strategies

5. Multi-environment management:
   - Environment-specific configurations
   - Seeding strategies per environment
   - Sensitive data handling
   - Development database refresh procedures
```

## Security Implementation

```prompt
Create a comprehensive security implementation for a full-stack application:

1. Authentication security:
   - Secure password hashing
   - JWT token security
   - Multi-factor authentication
   - Session management
   - Crypto wallet authentication security

2. API security:
   - CORS configuration
   - Rate limiting
   - Request validation
   - API key management
   - Input sanitization

3. Frontend security:
   - Content Security Policy
   - XSS prevention
   - CSRF protection
   - Secure cookie handling
   - Security headers

4. Data security:
   - Data encryption at rest
   - Transport layer security
   - PII handling compliance
   - Audit logging
   - Data access controls

5. Infrastructure security:
   - Network security controls
   - Container security
   - Dependency vulnerability scanning
   - Secret management
   - Security monitoring
```

## Performance Optimization

```prompt
Create a performance optimization strategy for a full-stack application:

1. Backend optimizations:
   - Database query optimization
   - Caching strategies
   - Connection pooling
   - Resource throttling
   - Worker processes

2. Frontend optimizations:
   - Bundle size reduction
   - Code splitting
   - Image optimization
   - Font loading strategies
   - Core Web Vitals optimization

3. API optimizations:
   - Response compression
   - Request batching
   - GraphQL optimization (if applicable)
   - HTTP/2 or HTTP/3 implementation
   - Edge caching

4. Mobile optimizations:
   - React Native performance tuning
   - Asset optimization
   - Memory management
   - Animation performance
   - Network request optimization

5. Infrastructure optimizations:
   - CDN implementation
   - Load balancing
   - Auto-scaling configuration
   - Geographic distribution
   - Edge computing integration
```