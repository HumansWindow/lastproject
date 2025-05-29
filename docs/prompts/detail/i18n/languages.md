# Languages Support

This document outlines the implementation of language support for the internationalization (i18n) system. This data is stored in the `/assets/data/languages.json` file and is used throughout the application for language selection, text direction management, and localized content delivery.

## Languages.json Format

The languages data is structured as follows:

```typescript
interface Language {
  code: string;       // ISO 639-1 language code
  name: string;       // English name of the language
  nativeName: string; // Name of the language in the language itself
  direction: string;  // Text direction: 'ltr' (left-to-right) or 'rtl' (right-to-left)
  active: boolean;    // Whether the language is currently active in the application
  default?: boolean;  // Whether this is the default fallback language
  translations?: {    // Optional mapping to other language codes
    [key: string]: string;
  };
}
```

## Implementation

The languages.json file should be placed at:

```
/assets/data/languages.json
```

Below is the content for the languages.json file with common languages:

```json
[
  {
    "code": "en",
    "name": "English",
    "nativeName": "English",
    "direction": "ltr",
    "active": true,
    "default": true
  },
  {
    "code": "es",
    "name": "Spanish",
    "nativeName": "Español",
    "direction": "ltr",
    "active": true
  },
  {
    "code": "fr",
    "name": "French",
    "nativeName": "Français",
    "direction": "ltr",
    "active": true
  },
  {
    "code": "de",
    "name": "German",
    "nativeName": "Deutsch",
    "direction": "ltr",
    "active": true
  },
  {
    "code": "it",
    "name": "Italian",
    "nativeName": "Italiano",
    "direction": "ltr",
    "active": true
  },
  {
    "code": "pt",
    "name": "Portuguese",
    "nativeName": "Português",
    "direction": "ltr",
    "active": true
  },
  {
    "code": "ru",
    "name": "Russian",
    "nativeName": "Русский",
    "direction": "ltr",
    "active": true
  },
  {
    "code": "zh",
    "name": "Chinese",
    "nativeName": "中文",
    "direction": "ltr",
    "active": true,
    "translations": {
      "zh-CN": "Simplified Chinese",
      "zh-TW": "Traditional Chinese"
    }
  },
  {
    "code": "ja",
    "name": "Japanese",
    "nativeName": "日本語",
    "direction": "ltr",
    "active": true
  },
  {
    "code": "ko",
    "name": "Korean",
    "nativeName": "한국어",
    "direction": "ltr",
    "active": true
  },
  {
    "code": "ar",
    "name": "Arabic",
    "nativeName": "العربية",
    "direction": "rtl",
    "active": true
  },
  {
    "code": "fa",
    "name": "Persian",
    "nativeName": "فارسی",
    "direction": "rtl",
    "active": true
  },
  {
    "code": "he",
    "name": "Hebrew",
    "nativeName": "עברית",
    "direction": "rtl",
    "active": true
  },
  {
    "code": "hi",
    "name": "Hindi",
    "nativeName": "हिन्दी",
    "direction": "ltr",
    "active": true
  },
  {
    "code": "tr",
    "name": "Turkish",
    "nativeName": "Türkçe",
    "direction": "ltr",
    "active": true
  }
]
```

## Integration with Profile System

The language data integrates with the profile system by:

1. **Setting User Preference**: The profile system stores the user's preferred language
2. **Persistence**: Language preference is stored in the profile and used across sessions
3. **Direction Management**: The application layout adjusts based on text direction (RTL/LTR)
4. **Content Loading**: Language code determines which translation files to load

## Language Detection and Selection Flow

1. **Initial Detection**:
   - Browser language detection on first visit
   - Default to 'en' if no supported language is detected

2. **User Selection**:
   - User can manually select a language from the language selector
   - Selected language is stored in profile (if authenticated) or cookies (if not)

3. **Order of Precedence**:
   - Explicitly selected language in profile
   - Explicitly selected language in cookies
   - Browser detected language
   - System default language (English)

## i18n Context Interface

```typescript
interface I18nContextProps {
  language: string;             // Current language code
  setLanguage: (code: string) => void;  // Function to change language
  t: (key: string, options?: {  // Translation function
    defaultValue?: string;
    fallback?: string;
    interpolation?: Record<string, string | number>;
  }) => string;
  direction: 'ltr' | 'rtl';     // Current text direction
  languages: Language[];        // Available languages
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (amount: number, currencyCode?: string) => string;
}
```

## Implementation with React Context

```tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useProfile } from '../profile/profile-context';

// Create context
const I18nContext = createContext<I18nContextProps>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
  direction: 'ltr',
  languages: [],
  formatDate: (date) => String(date),
  formatNumber: (number) => String(number),
  formatCurrency: (amount) => String(amount),
});

// Provider component
export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useProfile();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({});
  const [language, setLanguageState] = useState<string>('en');
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  
  // Load available languages
  useEffect(() => {
    fetch('/assets/data/languages.json')
      .then(res => res.json())
      .then(data => {
        setLanguages(data);
        
        // Set initial language based on profile or browser
        const initialLanguage = profile?.language || 
          localStorage.getItem('language') || 
          navigator.language.split('-')[0] || 
          'en';
          
        setLanguage(initialLanguage);
      })
      .catch(error => {
        console.error('Failed to load languages:', error);
        // Fallback to English on error
        setLanguages([{
          code: 'en',
          name: 'English',
          nativeName: 'English',
          direction: 'ltr',
          active: true,
          default: true
        }]);
      });
  }, []);
  
  // Load translations for the current language
  useEffect(() => {
    if (!language) return;
    
    // Check if we already have translations for this language
    if (translations[language]) {
      return;
    }
    
    // Load translations file
    fetch(`/assets/i18n/${language}.json`)
      .then(res => res.json())
      .then(data => {
        setTranslations(prev => ({
          ...prev,
          [language]: data
        }));
      })
      .catch(error => {
        console.error(`Failed to load translations for ${language}:`, error);
        
        // If failed and not English, try loading English as fallback
        if (language !== 'en' && !translations['en']) {
          fetch('/assets/i18n/en.json')
            .then(res => res.json())
            .then(data => {
              setTranslations(prev => ({
                ...prev,
                en: data
              }));
            })
            .catch(err => {
              console.error('Failed to load fallback translations:', err);
            });
        }
      });
  }, [language]);
  
  // Function to change language
  const setLanguage = (code: string) => {
    // Find the language
    const lang = languages.find(l => l.code === code);
    if (!lang) {
      console.error(`Language ${code} not found`);
      return;
    }
    
    // Update language and direction
    setLanguageState(code);
    setDirection(lang.direction as 'ltr' | 'rtl');
    
    // Save to localStorage
    localStorage.setItem('language', code);
    
    // Save to profile if authenticated
    if (profile) {
      // API call to update profile language preference
      fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language: code }),
      }).catch(error => {
        console.error('Failed to save language preference:', error);
      });
    }
    
    // Set html dir attribute for RTL/LTR support
    document.documentElement.dir = lang.direction;
    document.documentElement.lang = code;
  };
  
  // Translation function
  const t = (key: string, options?: {
    defaultValue?: string;
    fallback?: string;
    interpolation?: Record<string, string | number>;
  }): string => {
    // Get translations for current language
    const currentTranslations = translations[language] || {};
    
    // Try to get translation
    let translation = currentTranslations[key];
    
    // If not found, try English
    if (!translation && language !== 'en') {
      translation = (translations['en'] || {})[key];
    }
    
    // If still not found, use fallback or key
    if (!translation) {
      translation = options?.fallback || options?.defaultValue || key;
    }
    
    // Handle interpolation
    if (options?.interpolation) {
      Object.entries(options.interpolation).forEach(([variable, value]) => {
        translation = translation.replace(new RegExp(`{{${variable}}}`, 'g'), String(value));
      });
    }
    
    return translation;
  };
  
  // Format date according to the current locale
  const formatDate = (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'object' ? date : new Date(date);
    return new Intl.DateTimeFormat(language, options).format(dateObj);
  };
  
  // Format number according to the current locale
  const formatNumber = (number: number, options?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat(language, options).format(number);
  };
  
  // Format currency according to the current locale
  const formatCurrency = (amount: number, currencyCode?: string): string => {
    const userCurrency = currencyCode || profile?.country ? 
      // Get currency for user's country
      getCurrencyForCountry(profile.country) : 
      'USD';
      
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency: userCurrency,
    }).format(amount);
  };
  
  // Helper function to get currency for a country
  const getCurrencyForCountry = (countryCode: string): string => {
    // This would come from the countries data
    // For now, hardcode some common ones
    const countryCurrencyMap: Record<string, string> = {
      'US': 'USD',
      'GB': 'GBP',
      'EU': 'EUR',
      'JP': 'JPY',
      'CN': 'CNY',
      'IN': 'INR',
      // Default to USD
      'default': 'USD'
    };
    
    return countryCurrencyMap[countryCode] || countryCurrencyMap['default'];
  };
  
  // Context value
  const value: I18nContextProps = {
    language,
    setLanguage,
    t,
    direction,
    languages,
    formatDate,
    formatNumber,
    formatCurrency,
  };
  
  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

// Custom hook for consuming the context
export const useI18n = () => useContext(I18nContext);
```

## Implementation Checklist

- [ ] Create languages.json file with all supported languages
- [ ] Implement I18n Context provider for React
- [ ] Create language translation files (en.json, es.json, etc.)
- [ ] Build language selector component
- [ ] Integrate language preferences with profile system
- [ ] Add RTL/LTR layout support
- [ ] Implement automated translation key extraction
- [ ] Set up language fallback mechanism
- [ ] Create language-specific formatting for dates, numbers, and currencies
- [ ] Support language-specific sorting and collation
- [ ] Add translation management system for content editors