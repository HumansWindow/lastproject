# Frontend Profile Integration Guide

**Last Updated**: April 26, 2025  
**Author**: Engineering Team  
**Status**: Stable

## Overview

This document provides a comprehensive guide to integrating with the profile system after the recent fixes for the `userId`/`user_id` field inconsistency issue. Frontend developers should follow these guidelines to ensure consistent interaction with the profile API endpoints.

## Profile System Architecture

The user profile system consists of two main components:

1. **Backend**: NestJS profile service that manages user profile data
2. **Frontend**: React components and services that interact with the profile API

The profile system supports:
- Profile creation during signup
- Profile completion after wallet authentication
- "Complete Later" functionality to defer profile completion
- Profile editing and updating

## API Endpoints Reference

| Endpoint | Method | Description | Auth Required |
|---------|--------|-------------|---------------|
| `/profile` | GET | Get current user's profile | Yes |
| `/profile` | POST | Create a new profile | Yes |
| `/profile` | PUT | Update current profile | Yes |
| `/profile/complete` | POST | Complete profile after wallet auth | Yes |
| `/profile/complete-later` | POST | Mark profile as "complete later" | Yes |
| `/profile/exists` | GET | Check if profile exists | Yes |
| `/profile/email` | PUT | Update email separately | Yes |

## Recent Fixes Implementation

After fixing the `userId`/`user_id` field inconsistency issue, we've enhanced the system with:

1. **Improved error handling**: The backend now provides clearer error messages for field naming inconsistencies
2. **Standardized field naming**: All database fields follow `snake_case` convention, while code uses `camelCase`
3. **Automated tests**: End-to-end tests validate the profile completion workflow
4. **Database trigger auditing**: Regular checks ensure naming consistency

### Database Trigger Changes

The previous database trigger was causing errors with this message:
```
record "new" has no field "userId"
```

We've resolved this by:
1. Removing the problematic trigger that was using camelCase field references
2. Creating a new trigger function that properly uses snake_case field names
3. Implementing field validation to ensure data integrity

### Error Handling Improvements

We've implemented a specialized `ProfileErrorHandlerService` that:
- Detects field naming inconsistencies automatically
- Provides clear error messages with potential fixes
- Categorizes errors for better debugging and reporting
- Helps developers understand and resolve database field issues

## Frontend Integration Guide

### Setting up Profile Components

Import the necessary components:

```tsx
import { useAuth } from '../contexts/auth';
import { profileService } from '../profile/profile-service';
import { ProfileOnboarding } from '../components/ProfileOnboarding';
```

### Database Field Naming Awareness

When working with the profile system, be aware of the following field naming conventions:

1. **Database fields**: Always use `snake_case` (e.g., `user_id`, `first_name`)
2. **TypeScript/JavaScript properties**: Always use `camelCase` (e.g., `userId`, `firstName`)
3. **ORM Mapping**: Entity properties map to database columns with explicit name declarations:

```typescript
// Profile entity example
@Column({ name: 'user_id' })  // Database column name (snake_case)
userId: string;               // TypeScript property (camelCase)
```

This ensures consistent mapping between the database schema and the application code.

### Profile Completion Flow

The profile completion workflow should typically follow this sequence:

1. **Authentication**: User authenticates (email+password or wallet)
2. **Check Profile**: Check if profile exists using auth context
3. **Create/Complete Profile**: Either create a new profile or complete an existing one
4. **Handle "Complete Later"**: Allow users to defer profile completion

Example implementation:

```tsx
const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, isLoading, updateUserProfile, isProfileComplete } = useAuth();
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    firstName: '',
    lastName: '',
    email: '',
  });
  
  // Submit handler for profile completion
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const success = await updateUserProfile(formData);
      if (success) {
        // Handle success
      } 
    } catch (err) {
      // Handle errors with the enhanced error messages
      console.error('Profile update error:', err);
    }
  };

  // Complete Later handler
  const handleCompleteLater = async () => {
    try {
      await profileService.markCompleteLater();
      // Redirect user to main app
    } catch (err) {
      // Handle errors
    }
  };
  
  return (
    // Component rendering
  );
};
```

### Authentication Context Integration

The profile system is tightly integrated with the authentication context. Make sure to use the auth context properly:

```tsx
// In component
const { user, isAuthenticated, isProfileComplete, completeUserProfile } = useAuth();

// Check if profile is complete
if (isAuthenticated && !isProfileComplete) {
  // Show profile completion form
}

// Update profile
const updateProfile = async () => {
  await completeUserProfile(profileData);
};
```

### Error Handling Best Practices

With our enhanced error handling, you can now display more descriptive error messages:

```tsx
try {
  await profileService.updateUserProfile(data);
} catch (error) {
  if (error.response?.data?.details?.type === 'FIELD_NAMING_INCONSISTENCY') {
    // This is a database field naming inconsistency error
    console.error('Database field inconsistency detected:', error.response.data.details);
    // Show developer-friendly error
    showDeveloperError(`Database field inconsistency: ${error.response.data.details.problematicField} vs ${error.response.data.details.correctField}`);
    // Log to monitoring system for engineering team to review
    logToMonitoring('field_naming_error', error.response.data.details);
  } else if (error.response?.status === 409) {
    // This is a conflict error (e.g., email already exists)
    setError('This email is already in use. Please try another.');
  } else {
    // Handle other errors
    setError('An error occurred while updating your profile.');
  }
}
```

## Testing the Profile System

### Manual Testing Steps

1. **Test Profile Creation**:
   - Register a new user
   - Verify the profile is created properly
   - Check that `userId` is correctly populated

2. **Test Profile Completion**:
   - Authenticate with wallet
   - Complete profile through form submission
   - Verify profile information is saved

3. **Test "Complete Later" Functionality**:
   - Authenticate with wallet
   - Click "Complete Later" button
   - Verify user can still access the app
   - Try to complete the profile later

4. **Test Profile Updates**:
   - Update existing profile fields
   - Verify changes are saved
   - Check that no field inconsistency errors occur

### Automated Testing

We've implemented comprehensive automated tests that you can use as reference:

1. **Unit Tests**: Check `backend/src/profile/tests/profile-completion.test.ts`
2. **Integration Tests**: Check `backend/src/profile/tests/profile-controller.integration.test.ts` 
3. **End-to-End Tests**: Check `backend/test/profile-completion.e2e-spec.ts`

You can also add frontend component tests following these patterns.

## Common Issues and Solutions

### 1. Profile not updating after completion

**Problem**: Profile data doesn't update immediately after completion.  
**Solution**: Make sure to update the local state and secureStorage after profile updates:

```typescript
// After successful profile update
setUser(updatedProfile);
secureStorage.setItem(USER_KEY, JSON.stringify(updatedProfile));
```

### 2. Authentication state not reflecting profile completion

**Problem**: `isProfileComplete` flag not updating after completion.  
**Solution**: Ensure proper state update:

```typescript
// After profile completion
setIsProfileComplete(true);
```

### 3. "Complete Later" not working correctly

**Problem**: "Complete Later" endpoint returns errors.  
**Solution**: Check for proper request formatting:

```typescript
// Correct format
await profileService.markCompleteLater();

// NOT
await profileService.markCompleteLater({ completeLater: true });
```

### 4. Database field naming inconsistencies

**Problem**: Errors mentioning `"record "new" has no field "userId"`  
**Solution**: This indicates a potential database trigger issue. Contact the backend team immediately as this could affect multiple users:

```typescript
// If you encounter errors mentioning field names like "userId" vs "user_id"
// Report to backend team with:
reportIssue({
  type: 'DATABASE_FIELD_NAMING',
  details: error.response?.data?.details || error.message,
  endpoint: '/profile/complete',  // or whichever endpoint was called
  timestamp: new Date()
});
```

## Best Practices

1. **Always use TypeScript interfaces** for profile data to ensure type safety
2. **Handle both authentication states** (email/password and wallet auth)
3. **Implement proper loading states** to improve UX
4. **Validate form data** before submission to prevent backend validation errors
5. **Test with different account types** to ensure all workflows work correctly

## Validation Rules

When implementing profile forms, ensure these validation rules are followed:

- **Email**: Must be a valid email format
- **Name fields**: Should be at least 2 characters
- **Phone**: Use proper international format
- **Profile completion**: Requires at least first name, last name, and either email or wallet address

## Future Enhancements

Our roadmap for the profile system includes:

1. Profile picture upload with resizing
2. Social media integration
3. Enhanced privacy controls
4. Profile verification badges
5. Public profile pages

## CI/CD Integration

We're working on integrating the following checks into our CI/CD pipeline:

1. **Automatic Database Trigger Auditing**: Using our `/scripts/audit-database-triggers.sh` script to detect naming inconsistencies in database triggers
2. **Pre-commit Hooks**: To validate naming conventions before code is committed
3. **Automated Tests**: Running profile completion tests to prevent regressions

## Developer Training

A developer training session is scheduled for May 2025 to cover:

1. Profile system architecture and best practices
2. Naming conventions throughout the codebase
3. Database-to-code mapping patterns
4. Error handling strategies for field naming issues
5. Best practices for frontend-backend integration

## Related Documentation

- [Naming Conventions](/docs/standards/naming-conventions.md)
- [Error Handling Guide](/docs/error-handling.md)
- [Authentication System](/docs/auth-system.md)
- [Wallet Integration](/docs/wallet-integration.md)
- [Profile Database Issue Fix](/docs/profile-database-issue-fix.md)

## Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Profile Creation | ✅ Stable | Fixed with new database trigger |
| Profile Completion | ✅ Stable | Working with both auth methods |
| Complete Later | ✅ Stable | Fixed with enhanced error handling |
| Field Validation | ✅ Stable | Now enforced at database level |
| Error Handling | ✅ Stable | Provides detailed field error information |
| CI/CD Integration | ⏳ Pending | Scheduled for next sprint |
| Schema Monitoring | ⏳ Pending | In planning stage |

For any questions or issues related to profile integration, contact the backend team or file an issue in the project repository.

---

*This documentation is maintained by the engineering team and should be updated whenever the profile system changes.*