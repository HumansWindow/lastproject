# Profile Service Documentation

**Last Updated**: May 7, 2025  
**Status**: Stable

## Overview

The Profile Service is a core component of our application that handles user profile data management. It serves as a central repository for user information that extends beyond basic authentication data. The system is designed to support both traditional authentication methods and wallet-based authentication with a flexible profile completion flow.

## Architecture

### Backend Structure

The Profile Service is implemented as a standalone module in the NestJS backend:

```
/backend/src/profile/
├── dto/                              # Data Transfer Objects
│   ├── profile.dto.ts                # Profile DTOs (create, update, etc.)
│   ├── geo-location.dto.ts           # Geo-location detection DTOs
│
├── entities/
│   └── profile.entity.ts             # Profile database entity definition
│
├── profile.controller.ts             # REST API endpoints
├── profile.module.ts                 # Module definition and dependencies
├── profile.service.ts                # Core business logic
├── profile-error-handler.service.ts  # Custom error handling for profiles
├── geo-location.service.ts           # Country/language detection service
│
└── tests/                            # Test files
    ├── profile-completion.test.ts    # Unit tests
    └── profile-controller.integration.test.ts  # Integration tests
```

### Frontend Structure

The Profile functionality on the frontend is structured as follows:

```
/frontend/
├── src/
│   ├── profile/
│   │   └── profile-service.ts        # Profile API client service
│   │
│   ├── components/
│   │   ├── ProfileOnboarding.tsx     # Profile onboarding flow component
│   │   ├── LocationDetector.tsx      # Country/language detection component
│   │   └── [...other profile components]
│   │
│   ├── pages/
│   │   └── profile.tsx               # Profile page implementation
│   │
│   └── contexts/
│       └── auth.tsx                  # Authentication context with profile integration
```

## Database Entity

The `Profile` entity is defined with the following key fields:

| Field Name | Database Column | Type | Description |
|------------|-----------------|------|-------------|
| id | id | UUID | Primary key for the profile |
| userId | user_id | UUID | Foreign key to the User entity |
| email | email | string | User's email address (optional) |
| password | password | string | Hashed password (for email/password auth) |
| firstName | first_name | string | User's first name |
| lastName | last_name | string | User's last name |
| displayName | display_name | string | User's display name |
| avatarUrl | avatar_url | string | URL to user's avatar image |
| bio | bio | text | User's biographical information |
| uniqueId | unique_id | string | Unique identifier for the user |
| country | country | string | User's country |
| city | city | string | User's city |
| state | state | string | User's state/province |
| postalCode | postal_code | string | User's postal/ZIP code |
| address | address | string | User's street address |
| latitude | latitude | decimal | GPS latitude |
| longitude | longitude | decimal | GPS longitude |
| language | language | string | User's preferred language |
| timezone | timezone | string | User's timezone |
| dateFormat | date_format | string | Preferred date format |
| timeFormat | time_format | string | Preferred time format (12h/24h) |
| phoneNumber | phone_number | string | User's phone number |
| website | website | string | User's website URL |
| twitterHandle | twitter_handle | string | Twitter handle |
| instagramHandle | instagram_handle | string | Instagram handle |
| linkedinProfile | linkedin_profile | string | LinkedIn profile URL |
| telegramHandle | telegram_handle | string | Telegram handle |
| locationVisibility | location_visibility | enum | Privacy level for location data |
| profileVisibility | profile_visibility | enum | Privacy level for profile data |
| emailNotifications | email_notifications | boolean | Email notification preference |
| pushNotifications | push_notifications | boolean | Push notification preference |
| completeLater | complete_later | boolean | Flag indicating deferred completion |
| createdAt | created_at | datetime | Profile creation timestamp |
| updatedAt | updated_at | datetime | Profile last update timestamp |
| lastLocationUpdate | last_location_update | datetime | When location was last updated |

## API Endpoints

The Profile Service exposes the following REST endpoints:

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|--------------|
| `/profile` | GET | Get current user's profile | Yes |
| `/profile` | POST | Create a new profile | Yes |
| `/profile` | PUT | Update current profile | Yes |
| `/profile/:id` | GET | Get profile by ID | Yes |
| `/profile` | DELETE | Delete current user's profile | Yes |
| `/profile/complete` | POST | Complete profile after wallet auth | Yes |
| `/profile/complete-later` | POST | Mark profile as "complete later" | Yes |
| `/profile/exists` | GET | Check if profile exists | Yes |
| `/profile/detect-location` | GET | Detect user's location from IP | Yes |
| `/profile/location` | PUT | Update location information | Yes |
| `/profile/email` | PUT | Update email address | Yes |
| `/profile/password` | PUT | Update password | Yes |
| `/profile/notifications` | PUT | Update notification settings | Yes |

## Core Functionality

### Profile Creation

Profiles can be created through several flows:

1. **Traditional Registration**: When a user registers with email/password, a profile is automatically created
2. **Wallet Authentication**: When a user connects their wallet, a minimal profile is created
3. **Manual Creation**: Explicitly calling the create profile endpoint

### Profile Completion

For wallet-authenticated users, the system supports a "complete profile" workflow:

1. User authenticates with their wallet
2. Application checks if profile exists and is complete
3. If incomplete, user is prompted to fill profile information
4. User can either complete the profile or choose "complete later"

### "Complete Later" Functionality

Users can defer profile completion by using the "complete later" option:

1. Sets the `completeLater` flag to true
2. Allows users to proceed with core functionality
3. The application can later remind users to complete their profiles

### Automatic Country & Language Detection

The system can automatically detect a user's country and preferred language:

1. Uses IP geolocation to determine country, city, and timezone
2. Examines browser's Accept-Language header for language preference
3. Provides detected values for user confirmation
4. Saves confirmed values to the profile

## Frontend Integration

### Example: Basic Profile Fetching

```typescript
import { profileService } from '../profile/profile-service';

// Get user profile
const fetchProfile = async () => {
  try {
    const profile = await profileService.getUserProfile();
    setProfileData(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
  }
};
```

### Example: Profile Completion Form

```tsx
const ProfileCompletion = () => {
  const { completeUserProfile } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    // other profile fields
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await completeUserProfile(formData);
      // Handle success (redirect, notification, etc.)
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit">Complete Profile</button>
    </form>
  );
};
```

### Example: Country & Language Detection

```tsx
import { LocationDetector } from '@/components/LocationDetector';

const ProfilePage = () => {
  const handleLocationDetected = (locationData) => {
    // Update profile with detected location
    updateUserProfile({
      country: locationData.country,
      city: locationData.city,
      language: locationData.language,
      timezone: locationData.timezone,
    });
  };

  return (
    <div>
      <h1>Profile</h1>
      <LocationDetector 
        onLocationConfirmed={handleLocationDetected}
        onSkip={() => setShowDetector(false)}
      />
    </div>
  );
};
```

## Best Practices

### Backend

1. **Field Naming Consistency**:
   - Database columns use `snake_case` (e.g., `user_id`, `first_name`)
   - TypeScript properties use `camelCase` (e.g., `userId`, `firstName`)
   - Always use explicit column name mapping in entity definitions

2. **Error Handling**:
   - Use the `ProfileErrorHandlerService` for consistent error responses
   - Include field naming inconsistency detection and reporting
   - Return user-friendly error messages when possible

3. **Transaction Management**:
   - Use transactions for operations that affect multiple tables
   - Implement proper rollback on failures

### Frontend

1. **Type Safety**:
   - Use TypeScript interfaces for all profile data
   - Define proper DTOs that match backend expectations

2. **State Management**:
   - Keep profile state in context when needed across components
   - Use local state for component-specific profile operations

3. **Form Validation**:
   - Validate form data before submission
   - Provide clear error messages for validation failures
   - Implement field-level validation with immediate feedback

4. **Loading & Error States**:
   - Show loading indicators during profile operations
   - Handle and display errors gracefully
   - Provide retry options for failed operations

## Validation Rules

- **Email**: Must be a valid email format
- **Name fields**: Should be at least 2 characters
- **Phone**: Use proper international format
- **Profile completion**: Requires at least first name, last name, and either email or wallet address

## Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Profile Creation | ✅ Stable | Working with both auth methods |
| Profile Completion | ✅ Stable | Working with both auth methods |
| Complete Later | ✅ Stable | Includes automatic geo-detection |
| Auto Country Detection | ✅ Stable | Implemented with user confirmation |
| Auto Language Detection | ✅ Stable | Based on IP and browser preferences |
| Field Validation | ✅ Stable | Enforced at database level |
| Error Handling | ✅ Stable | Provides detailed field error information |

## Future Enhancements

1. **Profile Picture Upload**: Add ability to upload and crop profile pictures
2. **Social Media Integration**: Deeper integration with social platforms
3. **Enhanced Privacy Controls**: More granular privacy settings
4. **Profile Verification**: Add verification badges for confirmed identities
5. **Public Profile Pages**: Shareable public profile URLs

## Troubleshooting

### Common Issues

1. **Profile not updating after completion**
   - Check that the proper auth token is being sent
   - Verify the profile service is returning success
   - Confirm that state updates are being applied correctly

2. **Authentication state not reflecting profile completion**
   - Ensure the auth context is updated after profile completion
   - Check that `isProfileComplete` getter is working correctly

3. **"Complete Later" not working correctly**
   - Verify the backend is properly setting the `completeLater` flag
   - Check that frontend redirects are happening correctly

4. **Database field naming inconsistencies**
   - Use the profile error handler service to detect naming issues
   - Review the entity definition for proper column name mapping

## Testing

### Manual Testing Steps

1. **Test Profile Creation**
   - Register a new user
   - Verify profile is created properly
   - Check all fields are saved correctly

2. **Test Profile Completion**
   - Authenticate with wallet
   - Complete profile through form submission
   - Verify profile information is saved

3. **Test "Complete Later" Functionality**
   - Authenticate with wallet
   - Click "Complete Later" button
   - Verify user can still access the app
   - Verify geo-detection data is saved when available

4. **Test Auto-Detection**
   - Use the country/language detection feature
   - Confirm detection results match expected values
   - Verify user can modify detected values

### Automated Testing

The following test files can be referenced for automated testing:

1. **Unit Tests**: `backend/src/profile/tests/profile-completion.test.ts`
2. **Integration Tests**: `backend/src/profile/tests/profile-controller.integration.test.ts`
3. **E2E Tests**: `backend/test/profile-completion.e2e-spec.ts`

## Related Documentation

- [Profile Integration Guide](/docs/frontend/profile-integration-guide.md)
- [Naming Conventions](/docs/standards/naming-conventions.md)
- [Error Handling Guide](/docs/error-handling.md)
- [Authentication System](/docs/auth-system.md)
- [Wallet Integration](/docs/wallet-integration.md)
- [Profile Database Issue Fix](/docs/profile-database-issue-fix.md)