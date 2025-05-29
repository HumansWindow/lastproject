# User Profile System

## Overview

This document outlines the implementation of a comprehensive user profile system that complements the Web3 authentication system. The profile system stores and manages user identity information separate from authentication credentials, allowing for rich user experiences while maintaining security and flexibility.

## Core Components

### 1. Profile Entity Structure

The profile entity contains user-specific information and preferences. All fields except the ID and user relationship are optional to allow gradual profile completion:

```typescript
interface Profile {
  id: string;                    // Primary key (UUID)
  userId: string;                // Foreign key to users table (from Web3 auth)
  
  // All fields below are optional
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  uniqueId?: string;             // Human-readable unique identifier (username)
  
  // Location information
  country?: string;              // ISO country code (from countries.json)
  city?: string;
  latitude?: number;
  longitude?: number;
  
  // User preferences
  language?: string;             // ISO language code (from languages.json), default: 'en'
  timezone?: string;
  dateFormat?: string;           // Default: 'yyyy-MM-dd'
  timeFormat?: string;           // Default: '24h'
  numberFormat?: {               // Number formatting preferences
    minimumFractionDigits: number;
    maximumFractionDigits: number;
    useGrouping: boolean;        // Whether to use thousand separators
  };
  currencyDisplay?: 'symbol' | 'code' | 'name'; // How to display currency
  
  // Contact information
  phoneNumber?: string;
  website?: string;
  
  // Social media profiles
  twitterHandle?: string;
  instagramHandle?: string;
  linkedinProfile?: string;
  telegramHandle?: string;
  
  // Privacy settings
  locationVisibility?: VisibilityLevel;    // Default: PRIVATE
  profileVisibility?: VisibilityLevel;     // Default: PUBLIC
  emailNotifications?: boolean;            // Default: true
  pushNotifications?: boolean;             // Default: true
  completeLater?: boolean;                 // Default: false
  
  // System fields
  createdAt: Date;
  updatedAt: Date;
  lastLocationUpdate?: Date;
}

enum VisibilityLevel {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  PRIVATE = 'private'
}
```

### 2. Integration with Internationalization System

The profile system integrates with the i18n system by:

1. **Storing Language Preference**: The profile contains the user's preferred language code, which is used by the i18n system
2. **Storing Format Preferences**: The profile contains preferences for date, time, and number formats
3. **Country Data**: The profile's country field references ISO country codes from the countries.json data file
4. **Localized Profile Fields**: When displaying profile information, text is translated according to the current language

#### Profile-to-i18n Integration Flow

```typescript
/**
 * Initialize i18n system with profile preferences
 */
function initializeI18nFromProfile(profile: Profile): void {
  const { language, dateFormat, timeFormat, numberFormat, currencyDisplay } = profile;
  
  // Set language if defined in profile
  if (language) {
    i18n.setLanguage(language);
  }
  
  // Set formatting preferences if defined
  if (dateFormat || timeFormat || numberFormat || currencyDisplay) {
    i18n.setFormatConfig({
      dateFormat: dateFormat || 'medium',
      timeFormat: timeFormat || '24h',
      numberFormat: numberFormat || {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        useGrouping: true
      },
      currencyDisplay: currencyDisplay || 'symbol',
      fallbackLocale: 'en',
      timezone: profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  }
}
```

#### Language Change with Profile Update

```typescript
/**
 * Update language preference in profile when changed in UI
 */
async function updateLanguagePreference(languageCode: string): Promise<void> {
  try {
    // Update UI immediately
    i18n.setLanguage(languageCode);
    
    // Update profile in database
    await profileService.update({
      language: languageCode
    });
    
    // Update document language and direction
    document.documentElement.lang = languageCode;
    const language = i18n.languages.find(l => l.code === languageCode);
    if (language) {
      document.documentElement.dir = language.direction;
    }
  } catch (error) {
    console.error('Failed to update language preference:', error);
    // Revert to previous language on error
    i18n.setLanguage(profile.language || 'en');
  }
}
```

### 3. Profile Service

The profile service manages profile creation, retrieval, and updates:

```typescript
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly i18nService: I18nService
  ) {}
  
  /**
   * Check if a profile exists for a user
   */
  async exists(userId: string): Promise<boolean> {
    const count = await this.profileRepository.count({ where: { userId } });
    return count > 0;
  }
  
  /**
   * Create a new profile for a user
   */
  async create(userId: string, profileData: Partial<Profile>): Promise<Profile> {
    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Check if profile already exists
    const existingProfile = await this.profileRepository.findOne({ where: { userId } });
    if (existingProfile) {
      throw new BadRequestException('Profile already exists for this user');
    }
    
    // Generate unique ID if provided
    if (profileData.uniqueId) {
      // Validate and ensure uniqueness
      const validatedUniqueId = await this.validateAndGenerateUniqueId(profileData.uniqueId);
      profileData.uniqueId = validatedUniqueId;
    }
    
    // Validate language if provided
    if (profileData.language) {
      this.validateLanguageCode(profileData.language);
    } else {
      // Set default language based on browser detection
      profileData.language = 'en'; // Default fallback
    }
    
    // Validate country if provided
    if (profileData.country) {
      this.validateCountryCode(profileData.country);
    }
    
    // Create and save the new profile
    const profile = this.profileRepository.create({
      userId,
      ...profileData,
    });
    
    return this.profileRepository.save(profile);
  }
  
  /**
   * Get a user's profile
   */
  async findByUserId(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }
  
  /**
   * Find a profile by uniqueId (username)
   */
  async findByUniqueId(uniqueId: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({ 
      where: { uniqueId },
      select: ['id', 'uniqueId', 'displayName', 'avatarUrl', 'bio', 'profileVisibility'] // Only return public info
    });
    
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    
    // Only return if profile is public or handle privacy settings
    if (profile.profileVisibility !== VisibilityLevel.PUBLIC) {
      // Additional logic for non-public profiles
      // Could check friendship status etc.
    }
    
    return profile;
  }
  
  /**
   * Update a user's profile
   */
  async update(userId: string, profileData: Partial<Profile>): Promise<Profile> {
    // Find the profile
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    
    // If uniqueId is being updated, validate it
    if (profileData.uniqueId && profileData.uniqueId !== profile.uniqueId) {
      profileData.uniqueId = await this.validateAndGenerateUniqueId(
        profileData.uniqueId, 
        profile.id
      );
    }
    
    // Validate country code if provided
    if (profileData.country) {
      this.validateCountryCode(profileData.country);
    }
    
    // Validate language code if provided
    if (profileData.language) {
      this.validateLanguageCode(profileData.language);
    }
    
    // Update profile fields
    Object.assign(profile, profileData);
    
    // Save and return the updated profile
    return this.profileRepository.save(profile);
  }
  
  /**
   * Delete a user's profile
   */
  async delete(userId: string): Promise<void> {
    const result = await this.profileRepository.delete({ userId });
    if (result.affected === 0) {
      throw new NotFoundException('Profile not found');
    }
  }
  
  /**
   * Validate and generate a unique ID for the user
   * @param requestedId The requested unique ID
   * @param excludeProfileId Optional profile ID to exclude from uniqueness check (for updates)
   */
  private async validateAndGenerateUniqueId(
    requestedId: string, 
    excludeProfileId?: string
  ): Promise<string> {
    // Sanitize: Convert to lowercase, replace spaces with underscores, remove special characters
    let sanitizedId = requestedId.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    // Check minimum length
    if (sanitizedId.length < 3) {
      throw new BadRequestException('Username must be at least 3 characters long');
    }
    
    // Check reserved usernames
    const reservedUsernames = ['admin', 'support', 'system', 'moderator', 'help', 'root'];
    if (reservedUsernames.includes(sanitizedId)) {
      throw new BadRequestException('This username is reserved');
    }
    
    // Ensure uniqueness with retries
    let isUnique = false;
    let attempt = 0;
    let candidateId = sanitizedId;
    
    while (!isUnique && attempt < 10) {
      // Build query to check for existing profiles with this uniqueId
      const queryBuilder = this.profileRepository
        .createQueryBuilder('profile')
        .where('profile.unique_id = :uniqueId', { uniqueId: candidateId });
      
      // Exclude current profile if updating
      if (excludeProfileId) {
        queryBuilder.andWhere('profile.id != :id', { id: excludeProfileId });
      }
      
      const existing = await queryBuilder.getOne();
      
      if (!existing) {
        isUnique = true;
      } else {
        // If not unique, append a number and try again
        attempt++;
        candidateId = `${sanitizedId}_${attempt}`;
      }
    }
    
    if (!isUnique) {
      throw new BadRequestException('Could not generate a unique username. Please try a different one.');
    }
    
    return candidateId;
  }
  
  /**
   * Validate country code against countries.json data
   */
  private validateCountryCode(countryCode: string): void {
    // Load countries.json and validate
    const countries = require('../../../assets/data/countries.json');
    const isValid = countries.some(country => country.code === countryCode);
    
    if (!isValid) {
      throw new BadRequestException(`Invalid country code: ${countryCode}`);
    }
  }
  
  /**
   * Validate language code against languages.json data
   */
  private validateLanguageCode(languageCode: string): void {
    // Load languages.json and validate
    const languages = require('../../../assets/data/languages.json');
    const isValid = languages.some(language => language.code === languageCode);
    
    if (!isValid) {
      throw new BadRequestException(`Invalid language code: ${languageCode}`);
    }
  }
  
  /**
   * Update location data for a profile
   */
  async updateLocation(userId: string, locationData: {
    latitude: number;
    longitude: number;
    country?: string;
    city?: string;
  }): Promise<Profile> {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    
    // Validate country code if provided
    if (locationData.country) {
      this.validateCountryCode(locationData.country);
    }
    
    // Update location fields
    profile.latitude = locationData.latitude;
    profile.longitude = locationData.longitude;
    if (locationData.country) profile.country = locationData.country;
    if (locationData.city) profile.city = locationData.city;
    profile.lastLocationUpdate = new Date();
    
    return this.profileRepository.save(profile);
  }
  
  /**
   * Get user's preferred language
   */
  async getUserLanguage(userId: string): Promise<string> {
    try {
      const profile = await this.profileRepository.findOne({ 
        where: { userId },
        select: ['language']
      });
      
      return profile?.language || 'en'; // Default to English if no profile or language preference
    } catch (error) {
      return 'en'; // Default to English on error
    }
  }
  
  /**
   * Get user's formatting preferences
   */
  async getUserFormattingPreferences(userId: string): Promise<{
    dateFormat?: string;
    timeFormat?: string;
    numberFormat?: any;
    currencyDisplay?: string;
    timezone?: string;
  }> {
    try {
      const profile = await this.profileRepository.findOne({
        where: { userId },
        select: ['dateFormat', 'timeFormat', 'numberFormat', 'currencyDisplay', 'timezone']
      });
      
      return {
        dateFormat: profile?.dateFormat,
        timeFormat: profile?.timeFormat,
        numberFormat: profile?.numberFormat,
        currencyDisplay: profile?.currencyDisplay,
        timezone: profile?.timezone
      };
    } catch (error) {
      return {}; // Return empty object on error
    }
  }
}
```

## 4. Integration with Web3 Authentication

The profile system must be tightly integrated with the Web3 authentication system, but remain separate from it. This allows users to authenticate via their wallet but have a full profile for personalization.

### Profile Creation Flow

1. **After Wallet Authentication**:
   When a user authenticates with their wallet for the first time, they should be prompted to create a profile:

```typescript
// In frontend authentication success handler
async function handleAuthSuccess(walletAuthResult) {
  // Store authentication tokens
  sessionManager.updateSessionTokens(
    walletAuthResult.accessToken,
    walletAuthResult.refreshToken
  );
  
  // Check if profile exists
  try {
    const profile = await profileService.getProfile();
    
    // Profile exists, initialize i18n with profile preferences
    initializeI18nFromProfile(profile);
    
    // Proceed to dashboard
    router.navigate('/dashboard');
  } catch (error) {
    if (error.status === 404) {
      // No profile exists, redirect to profile creation
      
      // Initialize i18n with browser language
      const browserLang = navigator.language.split('-')[0];
      i18n.setLanguage(browserLang);
      
      router.navigate('/complete-profile');
    } else {
      handleError(error);
    }
  }
}
```

2. **Profile Creation Form**:
   Present a form to collect basic profile information with validation for uniqueId:

```tsx
function ProfileCreationForm() {
  const { t, language, languages, setLanguage } = useI18n();
  const [countries, setCountries] = useState([]);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    uniqueId: '',
    country: '',
    language: language, // Pre-populate with current i18n language
    // ... other fields
  });
  
  const [errors, setErrors] = useState({});
  const [isCheckingUniqueId, setIsCheckingUniqueId] = useState(false);
  const [completeLater, setCompleteLater] = useState(false);
  
  // Load countries data for dropdowns
  useEffect(() => {
    // Load countries from JSON file
    fetch('/assets/data/countries.json')
      .then(res => res.json())
      .then(data => setCountries(data));
  }, []);
  
  // Check username availability
  const checkUniqueIdAvailability = async (value) => {
    if (!value || value.length < 3) return;
    
    setIsCheckingUniqueId(true);
    try {
      const response = await fetch(`/api/profiles/check-username?uniqueId=${encodeURIComponent(value)}`);
      const data = await response.json();
      
      if (!response.ok) {
        setErrors({...errors, uniqueId: data.message || t('profile.errors.usernameNotAvailable')});
      } else {
        setErrors({...errors, uniqueId: null});
      }
    } catch (error) {
      setErrors({...errors, uniqueId: t('profile.errors.checkingUsername')});
    } finally {
      setIsCheckingUniqueId(false);
    }
  };
  
  // Debounced username check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.uniqueId) {
        checkUniqueIdAvailability(formData.uniqueId);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [formData.uniqueId]);
  
  // Handle language change in the form
  const handleLanguageChange = (e) => {
    const langCode = e.target.value;
    setFormData({...formData, language: langCode});
    setLanguage(langCode); // Update UI language immediately
  };
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      await profileService.createProfile({
        ...formData,
        completeLater,
      });
      
      // Initialize i18n with selected language
      initializeI18nFromProfile({
        language: formData.language,
        // Other preferences
      });
      
      router.navigate('/dashboard');
    } catch (error) {
      handleError(error);
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <h1>{t('profile.creation.title')}</h1>
      <p>{t('profile.creation.subtitle')}</p>
      
      {/* Form fields */}
      <div className="form-group">
        <label>{t('profile.labels.firstName')}</label>
        <input
          type="text"
          value={formData.firstName}
          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
        />
      </div>
      
      <div className="form-group">
        <label>{t('profile.labels.username')}</label>
        <input
          type="text"
          value={formData.uniqueId}
          onChange={(e) => setFormData({...formData, uniqueId: e.target.value})}
        />
        {isCheckingUniqueId && <span className="hint">{t('profile.usernameChecking')}</span>}
        {errors.uniqueId && <span className="error">{errors.uniqueId}</span>}
        {!errors.uniqueId && formData.uniqueId.length >= 3 && 
          <span className="success">{t('profile.usernameAvailable')}</span>}
      </div>
      
      <div className="form-group">
        <label>{t('profile.labels.country')}</label>
        <select
          value={formData.country || ''}
          onChange={(e) => setFormData({...formData, country: e.target.value})}
        >
          <option value="">{t('common.select.placeholder')}</option>
          {countries.map(country => (
            <option key={country.code} value={country.code}>
              {/* Display country name in the current language if available */}
              {country.translations[language] || country.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="form-group">
        <label>{t('profile.labels.language')}</label>
        <select
          value={formData.language || 'en'}
          onChange={handleLanguageChange}
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.nativeName} ({lang.name})
            </option>
          ))}
        </select>
      </div>
      
      {/* Format preferences */}
      <div className="form-group">
        <label>{t('profile.labels.dateFormat')}</label>
        <select
          value={formData.dateFormat || 'medium'}
          onChange={(e) => setFormData({...formData, dateFormat: e.target.value})}
        >
          <option value="short">{t('profile.dateFormats.short')}</option>
          <option value="medium">{t('profile.dateFormats.medium')}</option>
          <option value="long">{t('profile.dateFormats.long')}</option>
          <option value="full">{t('profile.dateFormats.full')}</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>{t('profile.labels.timeFormat')}</label>
        <select
          value={formData.timeFormat || '24h'}
          onChange={(e) => setFormData({...formData, timeFormat: e.target.value})}
        >
          <option value="12h">{t('profile.timeFormats.12h')}</option>
          <option value="24h">{t('profile.timeFormats.24h')}</option>
        </select>
      </div>
      
      {/* ... other form fields ... */}
      
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={completeLater}
            onChange={(e) => setCompleteLater(e.target.checked)}
          />
          {t('profile.labels.completeLater')}
        </label>
      </div>
      
      <button type="submit">{t('common.buttons.save')}</button>
    </form>
  );
}
```

### Incomplete Profile Handling

For users who choose to complete their profile later, we need to implement a system to remind them and manage partial profiles:

```typescript
// Guard to check if profile is complete or explicitly deferred
function ProfileGuard({ children }) {
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [shouldPrompt, setShouldPrompt] = useState(false);
  
  useEffect(() => {
    async function checkProfile() {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      
      try {
        const profile = await profileService.getProfile();
        // Check if profile has required fields or is explicitly deferred
        const isComplete = Boolean(
          profile.completeLater || 
          (profile.displayName && profile.email)
        );
        
        setShouldPrompt(!isComplete);
        setLoading(false);
      } catch (error) {
        setShouldPrompt(true);
        setLoading(false);
      }
    }
    
    checkProfile();
  }, [isAuthenticated]);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (shouldPrompt) {
    return <ProfilePrompt />;
  }
  
  return children;
}

// Profile completion prompt component
function ProfilePrompt() {
  const { t } = useI18n();
  
  return (
    <div className="profile-prompt">
      <h2>{t('profile.prompt.title')}</h2>
      <p>{t('profile.prompt.message')}</p>
      
      <div className="profile-prompt-actions">
        <button 
          className="primary"
          onClick={() => router.navigate('/complete-profile')}
        >
          {t('profile.prompt.completeNow')}
        </button>
        
        <button
          className="secondary"
          onClick={async () => {
            // Mark profile as deferred
            await profileService.update({
              completeLater: true
            });
            
            // Reload the current page
            window.location.reload();
          }}
        >
          {t('profile.prompt.later')}
        </button>
      </div>
    </div>
  );
}
```

## 5. Backend API for Uniqueness Validation

To ensure uniqueId (username) is unique across the system, we need a dedicated API endpoint:

```typescript
@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}
  
  // ... other endpoints ...
  
  @Get('check-username')
  @ApiOperation({ summary: 'Check if a username is available' })
  @ApiQuery({ name: 'uniqueId', description: 'Username to check availability' })
  @ApiResponse({ status: 200, description: 'Username is available' })
  @ApiResponse({ status: 400, description: 'Username is invalid or not available' })
  async checkUsernameAvailability(
    @Query('uniqueId') uniqueId: string,
    @I18nLang() lang: string
  ) {
    if (!uniqueId || uniqueId.length < 3) {
      throw new BadRequestException(
        this.i18nService.translate('profile.errors.usernameTooShort', lang)
      );
    }
    
    // Check if username is reserved
    const reservedUsernames = ['admin', 'support', 'system', 'moderator', 'help', 'root'];
    if (reservedUsernames.includes(uniqueId.toLowerCase())) {
      throw new BadRequestException(
        this.i18nService.translate('profile.errors.usernameReserved', lang)
      );
    }
    
    // Sanitize username
    const sanitizedId = uniqueId.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (sanitizedId !== uniqueId.toLowerCase()) {
      throw new BadRequestException(
        this.i18nService.translate('profile.errors.usernameInvalidChars', lang)
      );
    }
    
    // Check if username exists
    const exists = await this.profileService.uniqueIdExists(sanitizedId);
    if (exists) {
      throw new BadRequestException(
        this.i18nService.translate('profile.errors.usernameTaken', lang)
      );
    }
    
    return { 
      available: true, 
      message: this.i18nService.translate('profile.usernameAvailable', lang)
    };
  }
}
```

## 6. Database Schema

```sql
-- Profile table with all fields optional except for id and user_id
CREATE TABLE "profiles" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "email" VARCHAR(255) UNIQUE,
  "first_name" VARCHAR(100),
  "last_name" VARCHAR(100),
  "display_name" VARCHAR(100),
  "avatar_url" VARCHAR(255),
  "bio" TEXT,
  "unique_id" VARCHAR(100) UNIQUE,
  
  -- Location information
  "country" VARCHAR(3),  -- ISO country code
  "city" VARCHAR(100),
  "latitude" DECIMAL(10,8),
  "longitude" DECIMAL(11,8),
  
  -- User preferences
  "language" VARCHAR(10) DEFAULT 'en',
  "timezone" VARCHAR(50),
  "date_format" VARCHAR(20) DEFAULT 'yyyy-MM-dd',
  "time_format" VARCHAR(5) DEFAULT '24h',
  "number_format" JSONB DEFAULT '{"minimumFractionDigits": 0, "maximumFractionDigits": 2, "useGrouping": true}',
  "currency_display" VARCHAR(10) DEFAULT 'symbol',
  
  -- Contact information
  "phone_number" VARCHAR(20),
  "website" VARCHAR(255),
  
  -- Social media profiles
  "twitter_handle" VARCHAR(50),
  "instagram_handle" VARCHAR(50),
  "linkedin_profile" VARCHAR(100),
  "telegram_handle" VARCHAR(50),
  
  -- Privacy settings
  "location_visibility" VARCHAR(20) DEFAULT 'private',
  "profile_visibility" VARCHAR(20) DEFAULT 'public',
  "email_notifications" BOOLEAN DEFAULT TRUE,
  "push_notifications" BOOLEAN DEFAULT TRUE,
  "complete_later" BOOLEAN DEFAULT FALSE,
  
  -- System fields
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "last_location_update" TIMESTAMP WITH TIME ZONE,
  
  -- Ensure user_id is unique (one profile per user)
  CONSTRAINT "unique_user_profile" UNIQUE ("user_id")
);

-- Create indexes
CREATE INDEX "idx_profiles_user_id" ON "profiles"("user_id");
CREATE INDEX "idx_profiles_unique_id" ON "profiles"("unique_id");
CREATE INDEX "idx_profiles_email" ON "profiles"("email");
```

## 7. Complete i18n Integration

The profile system serves as a central integration point for the i18n system:

```typescript
// In an AuthGuard or middleware
@Injectable()
export class I18nProfileMiddleware implements NestMiddleware {
  constructor(
    private readonly profileService: ProfileService,
    private readonly i18nService: I18nService
  ) {}

  async use(req: Request, res: Response, next: Function) {
    // Set default language
    let language = 'en';
    let formatPreferences = {};
    
    try {
      // If authenticated, get user's preferred language from profile
      if (req.user && req.user.id) {
        language = await this.profileService.getUserLanguage(req.user.id);
        formatPreferences = await this.profileService.getUserFormattingPreferences(req.user.id);
      } else {
        // Otherwise check browser language or use language from cookie/session
        language = req.cookies?.lang || 
                  req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 
                  'en';
      }
      
      // Set language for this request
      req.i18nLang = language;
      
      // Set format preferences for number/date formatting
      if (Object.keys(formatPreferences).length > 0) {
        req.formatPreferences = formatPreferences;
      }
      
    } catch (error) {
      // On error, use default language
      req.i18nLang = 'en';
    }
    
    next();
  }
}
```

### Profile Settings UI for Language and Formatting

```tsx
function LanguageAndFormattingSettings() {
  const { t, language, languages, setLanguage } = useI18n();
  const { profile, updateProfile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    language: profile.language || 'en',
    dateFormat: profile.dateFormat || 'medium',
    timeFormat: profile.timeFormat || '24h',
    numberFormat: profile.numberFormat || {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      useGrouping: true
    },
    currencyDisplay: profile.currencyDisplay || 'symbol'
  });
  
  const handleLanguageChange = (e) => {
    const langCode = e.target.value;
    setFormData({...formData, language: langCode});
    
    // Update UI language immediately for better UX
    setLanguage(langCode);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await updateProfile(formData);
      setSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Sample date
  const sampleDate = new Date();
  
  return (
    <div className="settings-section">
      <h2>{t('profile.settings.language')}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>{t('profile.labels.language')}</label>
          <select
            value={formData.language}
            onChange={handleLanguageChange}
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>{t('profile.labels.dateFormat')}</label>
          <select
            value={formData.dateFormat}
            onChange={e => setFormData({...formData, dateFormat: e.target.value})}
          >
            <option value="short">{t('profile.dateFormats.short')} ({formatDate(sampleDate, {format: 'short'})})</option>
            <option value="medium">{t('profile.dateFormats.medium')} ({formatDate(sampleDate, {format: 'medium'})})</option>
            <option value="long">{t('profile.dateFormats.long')} ({formatDate(sampleDate, {format: 'long'})})</option>
            <option value="full">{t('profile.dateFormats.full')} ({formatDate(sampleDate, {format: 'full'})})</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>{t('profile.labels.timeFormat')}</label>
          <select
            value={formData.timeFormat}
            onChange={e => setFormData({...formData, timeFormat: e.target.value})}
          >
            <option value="12h">{t('profile.timeFormats.12h')} ({formatTime(sampleDate, {format: '12h'})})</option>
            <option value="24h">{t('profile.timeFormats.24h')} ({formatTime(sampleDate, {format: '24h'})})</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>{t('profile.labels.numberSeparator')}</label>
          <select
            value={formData.numberFormat.useGrouping.toString()}
            onChange={e => setFormData({
              ...formData, 
              numberFormat: {
                ...formData.numberFormat,
                useGrouping: e.target.value === 'true'
              }
            })}
          >
            <option value="true">{t('profile.numberFormats.withSeparator')} (1,234,567.89)</option>
            <option value="false">{t('profile.numberFormats.withoutSeparator')} (1234567.89)</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>{t('profile.labels.currencyDisplay')}</label>
          <select
            value={formData.currencyDisplay}
            onChange={e => setFormData({...formData, currencyDisplay: e.target.value})}
          >
            <option value="symbol">{t('profile.currencyFormats.symbol')} ($100)</option>
            <option value="code">{t('profile.currencyFormats.code')} (USD 100)</option>
            <option value="name">{t('profile.currencyFormats.name')} (100 US dollars)</option>
          </select>
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="primary-button"
        >
          {loading ? t('common.loading') : t('common.buttons.save')}
        </button>
        
        {success && (
          <div className="success-message">
            {t('profile.settings.savedSuccess')}
          </div>
        )}
      </form>
    </div>
  );
}
```

## Security Considerations

1. **Data Separation**: Keep authentication data (wallets, sessions) separate from profile data to limit exposure
2. **Privacy Controls**: Allow users to control visibility of their profile information
3. **Input Validation**: Validate all user inputs to prevent injection attacks
4. **Username Validation**: Carefully validate uniqueId to prevent impersonation or confusion
5. **Audit Logging**: Log all significant profile changes for security auditing
6. **Suspicion Detection**: Flag suspicious activities (e.g. profile updates from new devices)
7. **Language-Based Security**: Ensure error messages maintain security context in all languages

## Integration with Web3Auth Geolocation

The profile system integrates with the Web3Auth geolocation features by:

1. **Syncing Location Data**: When Web3Auth detects a location, offer to update the profile's location
2. **Privacy Controls**: Respect the profile's locationVisibility setting when sharing location data
3. **Location Verification**: Use Web3Auth location for security verification but profile location for features

```typescript
// Sync Web3Auth location with profile if allowed
async function syncLocationWithProfile(userId: string, locationData: LocationData): Promise<void> {
  try {
    const profile = await profileService.findByUserId(userId);
    
    // Only update if profile location is older than 24 hours or doesn't exist
    const needsUpdate = !profile.lastLocationUpdate || 
      (Date.now() - profile.lastLocationUpdate.getTime() > 24 * 60 * 60 * 1000);
    
    if (needsUpdate) {
      await profileService.updateLocation(userId, {
        latitude: locationData.coordinates.latitude,
        longitude: locationData.coordinates.longitude,
        country: locationData.country,
        city: locationData.city
      });
    }
  } catch (error) {
    console.error('Failed to sync location with profile:', error);
  }
}
```

## Implementation Checklist

- [ ] Create Profile entity and database schema with formatting preferences
- [ ] Create integration between profile and i18n systems
- [ ] Implement ProfileService with language and country validation
- [ ] Create API endpoint for uniqueId (username) availability checking
- [ ] Develop profile creation workflow after wallet authentication
- [ ] Build profile completion reminder system
- [ ] Implement language and formatting preference settings
- [ ] Integrate profile language preference with i18n system
- [ ] Create integration with the Web3 authentication geolocation system
- [ ] Add device verification for sensitive profile operations
- [ ] Build profile data export and deletion capabilities (data rights)
- [ ] Implement audit logging for profile changes
- [ ] Create admin dashboard for profile management