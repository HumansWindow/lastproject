# Implementing i18n Across All Application Text Elements

## Overview

This guide explains how to implement internationalization (i18n) for all text elements throughout your application, ensuring consistent multilingual support that integrates with the user profile system and Web3 authentication flow.

## Integration with Core i18n System

This document builds on the fundamental i18n systems described in:

- [i18n.md](/docs/prompts/detail/i18n/i18n.md) - Core i18n system overview
- [languages.md](/docs/prompts/detail/i18n/languages.md) - Language support specifications
- [formatting.md](/docs/prompts/detail/i18n/formatting.md) - Date, number, and currency formatting
- [translation.md](/docs/prompts/detail/i18n/translation.md) - Translation management system

## Complete Text Internationalization Strategy

### 1. Identifying Text Elements for Translation

All text visible to users should be internationalized, including:

- UI labels, buttons, and form elements
- Error messages and notifications
- Dynamic content and user-generated content (where appropriate)
- Modal dialogs and confirmation messages
- Email templates and notifications
- PDF reports and documents
- SEO metadata (titles, descriptions)
- Legal text (terms of service, privacy policy)
- System-generated notifications
- Web3 authentication messages and wallet-related text

### 2. Component-Level Implementation

#### React Components with i18n Hook

Use the `useI18n` hook in all components with text elements:

```tsx
import React from 'react';
import { useI18n } from '../contexts/i18n-context';

export const LoginButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const { t } = useI18n();
  
  return (
    <button 
      className="login-button" 
      onClick={onClick}
      aria-label={t('auth.login.buttonAriaLabel')}
    >
      {t('auth.login.connectWallet')}
    </button>
  );
};
```

#### Form Validation Messages

Ensure all validation messages are internationalized:

```tsx
import { useI18n } from '../contexts/i18n-context';
import { useForm } from 'react-hook-form';

export const ProfileForm: React.FC = () => {
  const { t } = useI18n();
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="form-group">
        <label>{t('profile.form.name')}</label>
        <input
          {...register('name', { 
            required: t('validation.required'),
            minLength: {
              value: 2,
              message: t('validation.minLength', { interpolation: { count: 2 } })
            }
          })}
        />
        {errors.name && <span className="error">{errors.name.message}</span>}
      </div>
      
      {/* ... other form fields ... */}
      
      <button type="submit">{t('common.buttons.save')}</button>
    </form>
  );
};
```

### 3. Text Content Organization by Domain

Organize translation keys by functional domain as specified in [translation.md](/docs/prompts/detail/i18n/translation.md):

```
// Proper organization of translation keys
auth.login.title
auth.login.instructions
auth.login.connectWallet
auth.login.success
auth.login.error

profile.form.title
profile.form.name
profile.form.email
profile.form.save
profile.form.cancel

wallet.selector.title
wallet.selector.instructions
wallet.selector.metamask
```

### 4. Backend Integration for Server-Side Rendered Content

Implement server-side i18n for any SSR content using the I18nService:

```typescript
// In a NestJS controller
@Controller('auth')
export class AuthController {
  constructor(private readonly i18nService: I18nService) {}
  
  @Get('login')
  @Render('login')
  loginPage(@Req() req: Request) {
    const language = req.i18nLang || 'en';
    
    return {
      title: this.i18nService.translate('auth.login.title', { 
        lang: language 
      }),
      instructions: this.i18nService.translate('auth.login.instructions', { 
        lang: language 
      }),
      // other i18n content
    };
  }
}
```

### 5. Text in API Responses

Internationalize error messages and other text in API responses:

```typescript
@Post('profile')
@UseGuards(JwtAuthGuard)
async updateProfile(
  @Req() req: Request,
  @Body() profileData: UpdateProfileDto
) {
  try {
    // Process update
    return {
      success: true,
      message: this.i18nService.translate('profile.update.success', {
        lang: req.i18nLang || 'en'
      })
    };
  } catch (error) {
    throw new BadRequestException(
      this.i18nService.translate('profile.update.error', {
        lang: req.i18nLang || 'en',
        params: { reason: error.message }
      })
    );
  }
}
```

### 6. Dynamic Text Interpolation

Use the interpolation mechanism described in [translation.md](/docs/prompts/detail/i18n/translation.md):

```tsx
// Interpolation in translations
// In translation file:
// "wallet.balance": "Your balance is {{amount}} {{currency}}"

const { t, formatCurrency } = useI18n();

const balanceText = t('wallet.balance', { 
  interpolation: {
    amount: formatCurrency(wallet.balance), 
    currency: wallet.currency 
  }
});
```

### 7. Pluralization Support

Use the pluralization system described in [formatting.md](/docs/prompts/detail/i18n/formatting.md):

```tsx
// Usage in component
const { t, plural } = useI18n();

const messageText = plural(count, {
  zero: t('notifications.messagesCount.zero'),
  one: t('notifications.messagesCount.one'),
  other: t('notifications.messagesCount.other', { 
    interpolation: { count } 
  })
});

// This leverages the Intl.PluralRules system for language-appropriate pluralization
```

## Integration with Web3 Authentication Flow

### 1. Wallet Connection Dialog

Internationalize all text in the wallet connection flow:

```tsx
import { useI18n } from '../contexts/i18n-context';
import { WalletSelector } from '../services/wallet-selector';

export const ConnectWalletDialog: React.FC = () => {
  const { t } = useI18n();
  const walletSelector = WalletSelector.getInstance();
  const providers = walletSelector.getProviders();
  
  return (
    <div className="wallet-dialog">
      <h2>{t('wallet.connect.title')}</h2>
      <p>{t('wallet.connect.instructions')}</p>
      
      <div className="wallet-list">
        {providers.map(provider => (
          <button
            key={provider.id}
            className="wallet-option"
            onClick={() => walletSelector.connectToWallet(provider.id)}
            disabled={!provider.installed || !provider.supported}
          >
            <img src={provider.icon} alt="" />
            <span>{provider.name}</span>
            <span className="wallet-description">
              {provider.installed 
                ? t('wallet.connect.clickToConnect')
                : t('wallet.connect.notInstalled', { 
                    interpolation: { name: provider.name }
                  })
              }
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
```

### 2. Authentication Error Messages

Ensure all authentication-related errors are internationalized:

```typescript
// In wallet authentication service
public async authenticate(walletAddress: string, signature: string): Promise<AuthResult> {
  try {
    // Authentication logic
  } catch (error) {
    const { t } = useI18n();
    
    // Map error codes to translation keys
    const errorMessages = {
      'invalid_signature': t('auth.errors.invalidSignature'),
      'expired_nonce': t('auth.errors.expiredNonce'),
      'network_error': t('auth.errors.networkError'),
      'default': t('auth.errors.unknown')
    };
    
    const errorMessage = errorMessages[error.code] || errorMessages.default;
    throw new Error(errorMessage);
  }
}
```

### 3. Session and Geolocation Messages

Internationalize any user-facing messages related to session management and geolocation:

```typescript
// In session manager
public async requestGeolocation(): Promise<LocationData | null> {
  const { t } = useI18n();
  
  try {
    // Request browser geolocation
    return await getUserLocation();
  } catch (error) {
    if (error.code === 1) { // Permission denied
      // Show internationalized error
      showNotification({
        type: 'error',
        message: t('session.geolocation.permissionDenied'),
        description: t('session.geolocation.enableInstructions')
      });
    } else {
      showNotification({
        type: 'error',
        message: t('session.geolocation.error'),
        description: t('session.geolocation.tryAgain')
      });
    }
    return null;
  }
}
```

### 4. Profile-Specific Internationalization

When working with user profile data, ensure all displayed information is properly localized:

```tsx
const ProfileDisplay: React.FC<{ profile: Profile }> = ({ profile }) => {
  const { t, formatDate, formatCurrency } = useI18n();
  
  return (
    <div className="profile-card">
      <h2>{t('profile.greeting', { interpolation: { name: profile.displayName || profile.uniqueId } })}</h2>
      
      {profile.country && (
        <div className="profile-location">
          {t('profile.location', { 
            interpolation: { 
              country: t(`countries.${profile.country}`) 
            }
          })}
        </div>
      )}
      
      {profile.lastLocationUpdate && (
        <div className="last-seen">
          {t('profile.lastSeen', { 
            interpolation: { 
              date: formatDate(profile.lastLocationUpdate, { format: 'relative' }) 
            }
          })}
        </div>
      )}
    </div>
  );
};
```

## Ensuring Complete Coverage

### 1. Text Extraction Script

Use the extraction script described in [translation.md](/docs/prompts/detail/i18n/translation.md) to extract all static text.

### 2. Missing Translation Detection

Implement the missing translation detection system from [translation.md](/docs/prompts/detail/i18n/translation.md):

```typescript
function reportMissingTranslation(key: string, language: string): void {
  // Skip reporting in production
  if (process.env.NODE_ENV === 'production') return;
  
  // Store missing key for later collection
  const missingKeys = JSON.parse(localStorage.getItem('i18n_missing_keys') || '{}');
  
  if (!missingKeys[language]) {
    missingKeys[language] = {};
  }
  
  // Record occurrence count and last seen timestamp
  if (!missingKeys[language][key]) {
    missingKeys[language][key] = {
      count: 0,
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };
  }
  
  missingKeys[language][key].count += 1;
  missingKeys[language][key].lastSeen = new Date().toISOString();
  
  localStorage.setItem('i18n_missing_keys', JSON.stringify(missingKeys));
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(`Missing translation: ${key} (${language})`);
  }
}
```

### 3. Translation Completion Dashboard

Use the admin dashboard described in [translation.md](/docs/prompts/detail/i18n/translation.md) for translation management.

## Best Practices for Team Collaboration

### 1. Translation Workflow for Content Teams

Follow the guidelines in [translation.md](/docs/prompts/detail/i18n/translation.md) for key creation and context provision.

### 2. Developer Guidelines

Documentation for developers on proper i18n implementation:

```markdown
## i18n Implementation Guidelines

1. **Never hardcode user-visible text**
   - Always use the t() function for any text shown to users
   - Include all text, even small words like "or", "and", "cancel"

2. **Provide context for translators**
   - Add comments for complex phrases
   - Use clear, descriptive keys that indicate where the text is used

3. **Handle pluralization properly**
   - Use the plural() function for quantity-based text
   - Test with various count values

4. **Use formatting functions for dates, numbers, and currencies**
   - Always use formatDate() instead of direct Date methods
   - Always use formatNumber() instead of direct number formatting
   - Always use formatCurrency() for monetary values
   
5. **Test with RTL languages**
   - Verify layout works with Arabic or Hebrew
   - Check text expansion for languages like German
```

### 3. Automated Testing for i18n

Create test utilities for i18n verification:

```typescript
// Test helper for verifying i18n implementation
function verifyComponentI18n(Component: React.ComponentType, expectedKeys: string[]): void {
  // For each supported language
  supportedLanguages.forEach(language => {
    // Render component with language
    const { getByText, queryAllByText } = render(
      <I18nProvider initialLanguage={language}>
        <Component />
      </I18nProvider>
    );
    
    // Check for untranslated keys (keys that appear as-is in the rendered output)
    expectedKeys.forEach(key => {
      const keyElements = queryAllByText(key, { exact: true });
      expect(keyElements).toHaveLength(0, 
        `Found untranslated key "${key}" in language "${language}"`
      );
    });
  });
}
```

## Implementation Checklist

- [ ] Audit existing components for hardcoded text
- [ ] Update all components to use the i18n system
- [ ] Ensure integration with profile system for language preferences
- [ ] Implement formatting for dates, numbers, and currencies
- [ ] Add translation support for all user-facing text
- [ ] Set up extraction script for translation keys
- [ ] Implement missing translation detection
- [ ] Create comprehensive translation files for supported languages
- [ ] Add pluralization support for quantity-based text
- [ ] Implement RTL testing and verification
- [ ] Create translation management dashboard
- [ ] Document i18n implementation guidelines for the team
- [ ] Set up CI/CD checks for new hardcoded strings