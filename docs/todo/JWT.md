# JWT Authentication Troubleshooting Guide

## Overview

This document provides guidance on how to check, debug, and fix JWT (JSON Web Token) issues in the authentication flow, including identifying and resolving duplicate tokens.

## Common JWT Issues

1. **Invalid Token Format** - Tokens not correctly formatted with "Bearer" prefix
2. **Token Validation Failures** - Secret mismatch, token expiration, or signature issues
3. **Duplicate Tokens** - Multiple tokens issued for the same user/session
4. **Token Storage Issues** - Tokens not properly stored in the database
5. **Refresh Token Problems** - Issues with token refresh workflow

## Diagnostic Steps

### 1. Enable JWT Debug Logging

Add the following to your `.env` file:

```
DEBUG=passport-jwt:*,express-jwt:*
LOG_LEVEL=debug
```

### 2. Check Token Format

Ensure tokens are correctly formatted in requests:

```typescript
// Correct format
headers: {
  Authorization: `Bearer ${accessToken}`
}

// Incorrect format
headers: {
  Authorization: accessToken
}
```

### 3. Verify Token Contents

Decode a JWT token to inspect its payload:

```javascript
const jwt = require('jsonwebtoken');

// Decode without verification (useful for debugging)
const decodedToken = jwt.decode(token);
console.log(JSON.stringify(decodedToken, null, 2));
```

### 4. Check for Token Duplicates

Run the following SQL query to identify duplicate refresh tokens:

```sql
SELECT token, COUNT(*), user_id
FROM refresh_tokens
GROUP BY token, user_id
HAVING COUNT(*) > 1;
```

### 5. Monitor Token Creation and Usage

Add logging in key authentication methods to track token lifecycle:

```typescript
// In token creation
this.logger.debug(`Generated token for user ${userId}: ${token.substring(0, 10)}...`);

// In token validation
this.logger.debug(`Validating token: ${token.substring(0, 10)}...`);
```

## Common Fixes

### Fix Invalid Token Format

Ensure all API requests include the proper Bearer prefix:

```typescript
// In test scripts or frontend code
axios.get('/api/endpoint', {
  headers: {
    Authorization: `Bearer ${accessToken}`
  }
});
```

### Fix Token Validation

Check that the JWT secret is consistent across the application:

1. Verify the `JWT_SECRET` in your `.env` file
2. Ensure the same secret is used for both token generation and validation
3. Check that the token expiration settings are appropriate

```javascript
// .env
JWT_SECRET=your-consistent-secret-key
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN=7d
```

### Fix Duplicate Tokens

1. Implement a cleanup script:

```typescript
async function cleanupDuplicateTokens() {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  
  try {
    // Find duplicate tokens
    const duplicates = await queryRunner.manager.query(`
      WITH dupes AS (
        SELECT token, user_id, MIN(created_at) as keep_date
        FROM refresh_tokens
        GROUP BY token, user_id
        HAVING COUNT(*) > 1
      )
      SELECT rt.id
      FROM refresh_tokens rt
      JOIN dupes d ON rt.token = d.token AND rt.user_id = d.user_id
      WHERE rt.created_at > d.keep_date
    `);
    
    // Delete duplicates but keep the oldest one
    for (const dupe of duplicates) {
      await queryRunner.manager.query(`DELETE FROM refresh_tokens WHERE id = $1`, [dupe.id]);
    }
    
    console.log(`Cleaned up ${duplicates.length} duplicate tokens`);
  } finally {
    await queryRunner.release();
  }
}
```

2. Prevent duplicates by adding a unique constraint:

```sql
ALTER TABLE refresh_tokens ADD CONSTRAINT unique_user_token UNIQUE(user_id, token);
```

### Fix Database Storage Issues

Ensure transactions are properly handled:

```typescript
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
  // Create and save token in transaction
  const token = queryRunner.manager.create(RefreshToken, {
    token: refreshToken,
    userId: userId,
    expiresAt: expiresAt
  });
  
  await queryRunner.manager.save(token);
  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release();
}
```

## Testing Authentication Flow

Run the authentication flow test script to verify your fixes:

```bash
cd /path/to/scripts/auth
chmod +x ./test-complete-auth-flow.js
./test-complete-auth-flow.js
```

## Authentication Flow Sequence

1. **Request Challenge** - Backend generates a challenge for wallet
2. **Sign Challenge** - User signs the challenge with their wallet
3. **Authenticate** - Backend verifies the signature and issues tokens
4. **Access Resources** - User accesses protected resources with the access token
5. **Refresh Token** - User obtains a new access token using refresh token when needed

## Checklist for JWT Issues

- [ ] JWT_SECRET is consistent across the application
- [ ] Token expiration times are appropriate
- [ ] Token format is correct in requests (Bearer prefix)
- [ ] RefreshToken entity has correct schema
- [ ] Token storage uses transactions properly
- [ ] No duplicate tokens exist in the database
- [ ] Auth guard and JWT strategy are correctly configured
- [ ] Debug logging is enabled to track token issues

## Additional Resources

- [JWT.io](https://jwt.io/) - Debug JWT tokens online
- [NestJS Authentication Docs](https://docs.nestjs.com/security/authentication)
- [Passport JWT Strategy](http://www.passportjs.org/packages/passport-jwt/)