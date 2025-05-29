# Internationalization (i18n) File Structure

This document outlines the complete file structure needed to implement the i18n system in both backend and frontend. This structure aligns with the specifications in the i18n documentation files.

## Core Data Files

These data files are common to both frontend and backend:

```
/assets/data/
  ├── languages.json            # Language definitions (ISO codes, names, native names, direction)
  └── countries.json            # Country definitions (ISO codes, names, translations, currencies)
```

## Translation Files

Translation files follow this structure:

```
/assets/i18n/
  ├── en.json                   # English translations (default)
  ├── es.json                   # Spanish translations
  ├── fr.json                   # French translations
  ├── de.json                   # German translations
  ├── ar.json                   # Arabic translations (RTL)
  ├── ja.json                   # Japanese translations
  └── ...                       # Other supported languages
```

## Backend Structure

```
/backend/
  ├── src/
  │   ├── i18n/
  │   │   ├── i18n.module.ts              # I18n module definition
  │   │   ├── i18n.service.ts             # Core i18n service
  │   │   ├── i18n.controller.ts          # Controller for i18n-related endpoints
  │   │   ├── i18n.middleware.ts          # Language detection middleware
  │   │   ├── i18n-lang.decorator.ts      # Request language parameter decorator
  │   │   ├── services/
  │   │   │   ├── translation.service.ts   # Translation loading and retrieval
  │   │   │   ├── formatting.service.ts    # Date/number/currency formatting
  │   │   │   └── language.service.ts      # Language detection and management
  │   │   ├── interceptors/
  │   │   │   └── i18n.interceptor.ts      # Automatic response translation
  │   │   ├── filters/
  │   │   │   └── i18n-exception.filter.ts # Translates error messages
  │   │   ├── guards/
  │   │   │   └── language-support.guard.ts # Validates language parameter
  │   │   ├── interfaces/
  │   │   │   ├── language.interface.ts    # Language definition interface
  │   │   │   ├── country.interface.ts     # Country definition interface
  │   │   │   └── translation.interface.ts  # Translation file interface
  │   │   └── dto/
  │   │       └── language-preference.dto.ts # DTO for updating language preference
  │   ├── common/
  │   │   └── types/
  │   │       └── i18n.types.ts            # Extended request types with i18n properties
  │   └── profile/
  │       └── interfaces/
  │           └── profile.interface.ts     # Profile interface with i18n preferences
  ├── assets/
  │   ├── data/
  │   │   ├── languages.json               # Language definitions
  │   │   └── countries.json               # Country definitions
  │   └── i18n/
  │       ├── en.json                      # English translations
  │       ├── es.json                      # Spanish translations
  │       └── ...                          # Other language files
  └── scripts/
      └── i18n/
          ├── extract-translations.ts      # Script to extract translation keys
          ├── validate-translations.ts     # Script to validate translation files
          └── import-translations.ts       # Script to import translations from external sources
```

## Frontend Structure

```
/frontend/
  ├── src/
  │   ├── contexts/
  │   │   └── i18n-context.tsx             # I18n React context provider
  │   ├── hooks/
  │   │   └── useI18n.ts                   # I18n custom hook
  │   ├── services/
  │   │   └── i18n/
  │   │       ├── translator.ts            # Translation functions
  │   │       ├── formatter.ts             # Formatting utilities
  │   │       ├── language-detector.ts     # Language detection
  │   │       └── storage.ts               # Language preference storage
  │   ├── components/
  │   │   └── i18n/
  │   │       ├── LanguageSelector.tsx     # Language selection dropdown
  │   │       ├── FormattingPreferences.tsx # Date/number format preferences
  │   │       ├── TranslatedText.tsx       # Component wrapper for translations
  │   │       ├── FormattedDate.tsx        # Component for formatted dates
  │   │       ├── FormattedNumber.tsx      # Component for formatted numbers
  │   │       └── FormattedCurrency.tsx    # Component for formatted currencies
  │   ├── utils/
  │   │   └── i18n/
  │   │       ├── language-utils.ts        # Language helper functions
  │   │       ├── rtl-utils.ts             # RTL handling utilities
  │   │       └── plural-rules.ts          # Pluralization helpers
  │   └── types/
  │       └── i18n.types.ts                # TypeScript type definitions for i18n
  ├── public/
  │   ├── assets/
  │   │   ├── data/
  │   │   │   ├── languages.json           # Language definitions
  │   │   │   └── countries.json           # Country definitions
  │   │   └── i18n/
  │   │       ├── en.json                  # English translations
  │   │       ├── es.json                  # Spanish translations
  │   │       └── ...                      # Other language files
  │   └── locales/
  │       └── country-flags/               # Country flag images
  └── scripts/
      └── i18n/
          ├── extract-translations.js      # Extract translation keys from code
          ├── validate-translations.js     # Validation script
          └── import-translations.js       # Import translations
```

## Shared Structure (for monorepo setups)

If using a monorepo structure with shared code:

```
/shared/
  ├── i18n/
  │   ├── constants/
  │   │   ├── languages.ts                 # Language code constants
  │   │   └── locales.ts                   # Locale constants
  │   ├── utils/
  │   │   ├── language-utils.ts            # Shared language utilities
  │   │   └── formatting-utils.ts          # Shared formatting utilities
  │   └── types/
  │       ├── language.types.ts            # Language interface definitions
  │       ├── country.types.ts             # Country interface definitions
  │       └── i18n.types.ts                # Shared i18n type definitions
  └── assets/
      ├── data/
      │   ├── languages.json               # Language definitions
      │   └── countries.json               # Country definitions
      └── i18n/
          ├── en.json                      # English translations
          ├── es.json                      # Spanish translations
          └── ...                          # Other language files
```

## Implementation Example Files

### Backend Implementation

**i18n.module.ts:**
```typescript
import { Module, Global, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { I18nService } from './i18n.service';
import { TranslationService } from './services/translation.service';
import { FormattingService } from './services/formatting.service';
import { LanguageService } from './services/language.service';
import { I18nMiddleware } from './i18n.middleware';
import { I18nExceptionFilter } from './filters/i18n-exception.filter';
import { APP_FILTER } from '@nestjs/core';

@Global()
@Module({
  providers: [
    I18nService,
    TranslationService,
    FormattingService,
    LanguageService,
    {
      provide: APP_FILTER,
      useClass: I18nExceptionFilter,
    },
  ],
  exports: [I18nService, TranslationService, FormattingService, LanguageService],
})
export class I18nModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(I18nMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
```

**i18n.service.ts:**
```typescript
import { Injectable } from '@nestjs/common';
import { TranslationService } from './services/translation.service';
import { FormattingService } from './services/formatting.service';
import { LanguageService } from './services/language.service';

@Injectable()
export class I18nService {
  constructor(
    private readonly translationService: TranslationService,
    private readonly formattingService: FormattingService,
    private readonly languageService: LanguageService,
  ) {}

  /**
   * Translate a key to the specified language
   */
  translate(key: string, options: {
    lang: string;
    defaultValue?: string;
    params?: Record<string, string | number>;
  }): string {
    return this.translationService.translate(key, options);
  }

  /**
   * Format a date according to the specified language
   */
  formatDate(date: Date | string, options: {
    lang: string;
    format?: string;
    timezone?: string;
  }): string {
    return this.formattingService.formatDate(date, options);
  }

  /**
   * Format a number according to the specified language
   */
  formatNumber(value: number, options: {
    lang: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    style?: 'decimal' | 'percent' | 'currency';
    currency?: string;
  }): string {
    return this.formattingService.formatNumber(value, options);
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return this.languageService.getSupportedLanguages();
  }

  /**
   * Check if a language is RTL
   */
  isRtl(languageCode: string): boolean {
    return this.languageService.isRtl(languageCode);
  }
}
```

### Frontend Implementation

**i18n-context.tsx:**
```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translateKey } from '../services/i18n/translator';
import { 
  formatDate, 
  formatNumber, 
  formatCurrency,
  formatRelativeTime,
  plural
} from '../services/i18n/formatter';
import { detectLanguage, setDocumentLanguage } from '../services/i18n/language-detector';
import { getStoredLanguage, storeLanguage } from '../services/i18n/storage';
import { Language } from '../types/i18n.types';

interface I18nContextType {
  language: string;
  languages: Language[];
  setLanguage: (code: string) => void;
  t: (key: string, options?: {
    defaultValue?: string;
    interpolation?: Record<string, string | number>;
  }) => string;
  direction: 'ltr' | 'rtl';
  formatDate: (date: Date | string | number, options?: any) => string;
  formatNumber: (number: number, options?: any) => string;
  formatCurrency: (amount: number, currencyCode?: string) => string;
  formatRelativeTime: (date: Date | string | number) => string;
  plural: (count: number, options: {
    zero?: string;
    one: string;
    other: string;
    many?: string;
    few?: string;
    two?: string;
  }) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{
  children: React.ReactNode;
  initialLanguage?: string;
}> = ({ children, initialLanguage }) => {
  // Implementation details...
  
  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
```

**LanguageSelector.tsx:**
```typescript
import React from 'react';
import { useI18n } from '../../hooks/useI18n';

export const LanguageSelector: React.FC<{
  className?: string;
}> = ({ className }) => {
  const { t, language, languages, setLanguage } = useI18n();
  
  return (
    <div className={`language-selector ${className || ''}`}>
      <label htmlFor="language-select" className="sr-only">
        {t('common.language.select')}
      </label>
      <select
        id="language-select"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="language-select"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName} ({lang.name})
          </option>
        ))}
      </select>
    </div>
  );
};
```

## Required Changes to Other Files

### Profile Entity (backend)

```typescript
// In backend/src/profile/entities/profile.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  // ... other profile fields

  @Column({ nullable: true, default: 'en' })
  language: string;

  @Column({ nullable: true, default: 'medium' })
  dateFormat: string;

  @Column({ nullable: true, default: '24h' })
  timeFormat: string;

  @Column({ type: 'jsonb', nullable: true, default: () => 
    "'{ \"minimumFractionDigits\": 0, \"maximumFractionDigits\": 2, \"useGrouping\": true }'" 
  })
  numberFormat: {
    minimumFractionDigits: number;
    maximumFractionDigits: number;
    useGrouping: boolean;
  };

  @Column({ nullable: true, default: 'symbol' })
  currencyDisplay: 'symbol' | 'code' | 'name';
  
  // ... other profile fields
}
```

### App Module (backend)

```typescript
// In backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { I18nModule } from './i18n/i18n.module';
// ... other imports

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      // database configuration
    }),
    // ... other modules
    I18nModule, // Add the I18n Module
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### Frontend App

```typescript
// In frontend/src/App.tsx or _app.tsx for Next.js
import React from 'react';
import { I18nProvider } from './contexts/i18n-context';
// ... other imports

function App() {
  return (
    <I18nProvider>
      {/* Rest of your app */}
    </I18nProvider>
  );
}

export default App;
```

## Implementation Steps

1. Create the directory structure as outlined above
2. Add language and country data files
3. Implement the core services for translation and formatting
4. Integrate with the profile system
5. Set up the translation extraction script
6. Implement frontend components and context
7. Test with multiple languages including RTL languages
8. Set up translation management tools for ongoing content management