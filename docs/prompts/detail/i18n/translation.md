# Translation Management

This document outlines the implementation of the translation management system for the internationalization (i18n) framework. This system handles the creation, storage, retrieval, and application of translated content across the application.

## Translation File Structure

The translation system uses a hierarchical JSON structure for organizing translations:

```
/assets/i18n/
  ├── en.json      # English (default language)
  ├── es.json      # Spanish
  ├── fr.json      # French
  ├── ar.json      # Arabic
  ├── zh.json      # Chinese
  └── ...          # Other language files
```

Each language file contains nested translation keys organized by feature or component:

```json
{
  "common": {
    "buttons": {
      "save": "Save",
      "cancel": "Cancel",
      "edit": "Edit",
      "delete": "Delete",
      "submit": "Submit"
    },
    "labels": {
      "email": "Email Address",
      "password": "Password",
      "username": "Username"
    },
    "validation": {
      "required": "This field is required",
      "email": "Please enter a valid email address",
      "minLength": "Must be at least {{length}} characters"
    },
    "errors": {
      "general": "An error occurred",
      "network": "Network error. Please check your connection"
    }
  },
  "auth": {
    "login": {
      "title": "Sign In",
      "subtitle": "Welcome back! Sign in to your account",
      "forgotPassword": "Forgot password?",
      "noAccount": "Don't have an account?",
      "createAccount": "Create one now"
    },
    "register": {
      "title": "Create Account",
      "subtitle": "Complete the form to get started",
      "termsAgree": "I agree to the {{terms}} and {{privacy}}",
      "terms": "Terms of Service",
      "privacy": "Privacy Policy",
      "alreadyAccount": "Already have an account?",
      "signIn": "Sign in"
    }
  },
  "profile": {
    "title": "My Profile",
    "personalInfo": "Personal Information",
    "address": {
      "title": "Address",
      "country": "Country",
      "city": "City",
      "street": "Street Address",
      "postalCode": {
        "default": "Postal Code",
        "US": "ZIP Code",
        "GB": "Postcode"
      },
      "phone": "Phone Number"
    },
    "language": "Language Preference",
    "settings": "Account Settings",
    "walletInfo": "Wallet Information"
  }
}
```

## Translation Key Naming Conventions

The translation system follows these naming conventions:

1. **Namespacing**:
   - Use feature/module names for top-level grouping
   - Use component names for second-level grouping
   - Use descriptive action/element names for leaf keys

2. **Key Format**:
   - All lowercase
   - Words separated by periods (dot notation)
   - Specific before general: `feature.component.element.action`

3. **Variable Interpolation**:
   - Use double curly braces for variables: `{{variableName}}`
   - Use descriptive variable names that match the data model

4. **Variants**:
   - For text with variants, append type: `label.status.active`, `label.status.inactive`

## Translation Loading System

The translation system loads translations dynamically:

```typescript
/**
 * Translation loader service
 */
export class TranslationLoader {
  private cache: Record<string, Record<string, string>> = {};
  private loadingPromises: Record<string, Promise<Record<string, string>>> = {};
  
  /**
   * Load a language file
   */
  async loadLanguage(language: string): Promise<Record<string, string>> {
    // Check cache first
    if (this.cache[language]) {
      return this.cache[language];
    }
    
    // Check if already loading
    if (this.loadingPromises[language]) {
      return this.loadingPromises[language];
    }
    
    // Start loading
    const loadPromise = this.fetchTranslationFile(language);
    this.loadingPromises[language] = loadPromise;
    
    try {
      const translations = await loadPromise;
      this.cache[language] = translations;
      delete this.loadingPromises[language];
      return translations;
    } catch (error) {
      delete this.loadingPromises[language];
      throw error;
    }
  }
  
  /**
   * Fetch the translation file for a language
   */
  private async fetchTranslationFile(language: string): Promise<Record<string, string>> {
    try {
      const response = await fetch(`/assets/i18n/${language}.json`);
      
      if (!response.ok) {
        throw new Error(`Failed to load translations for ${language}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error loading translations for ${language}:`, error);
      throw error;
    }
  }
  
  /**
   * Clear the cache for a specific language or all languages
   */
  clearCache(language?: string): void {
    if (language) {
      delete this.cache[language];
    } else {
      this.cache = {};
    }
  }
  
  /**
   * Preload multiple languages
   */
  async preloadLanguages(languages: string[]): Promise<void> {
    await Promise.all(languages.map(lang => this.loadLanguage(lang)));
  }
}
```

## Server-side Translation Support

For server-side rendering and API responses, a corresponding backend service is implemented:

```typescript
@Injectable()
export class I18nService {
  private translations: Record<string, Record<string, string>> = {};
  
  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache
  ) {
    // Load translations at startup
    this.loadTranslations();
  }
  
  /**
   * Load all translation files
   */
  private async loadTranslations(): Promise<void> {
    const supportedLanguages = this.configService.get<string[]>('i18n.supportedLanguages', ['en']);
    
    for (const language of supportedLanguages) {
      try {
        const filePath = join(process.cwd(), 'assets', 'i18n', `${language}.json`);
        const fileContent = await readFile(filePath, 'utf8');
        this.translations[language] = JSON.parse(fileContent);
      } catch (error) {
        console.error(`Failed to load translations for ${language}:`, error);
        // Ensure at least English is available
        if (language === 'en') {
          this.translations['en'] = {};
        }
      }
    }
  }
  
  /**
   * Translate a key in a specific language
   */
  translate(key: string, language: string, options?: {
    defaultValue?: string;
    interpolation?: Record<string, string | number>;
  }): string {
    // Get translations for the language
    const languageTranslations = this.translations[language] || this.translations['en'] || {};
    
    // Get translation for the key (flattened)
    let translation = this.getNestedTranslation(languageTranslations, key);
    
    // If not found, try English or use fallback
    if (!translation && language !== 'en') {
      translation = this.getNestedTranslation(this.translations['en'] || {}, key);
    }
    
    // Use fallback if still not found
    if (!translation) {
      translation = options?.defaultValue || key;
    }
    
    // Handle interpolation
    if (options?.interpolation) {
      Object.entries(options.interpolation).forEach(([variable, value]) => {
        translation = translation.replace(new RegExp(`{{${variable}}}`, 'g'), String(value));
      });
    }
    
    return translation;
  }
  
  /**
   * Get a nested translation value
   */
  private getNestedTranslation(translations: Record<string, any>, key: string): string | undefined {
    const parts = key.split('.');
    let current = translations;
    
    for (const part of parts) {
      if (current[part] === undefined) {
        return undefined;
      }
      current = current[part];
    }
    
    return typeof current === 'string' ? current : undefined;
  }
  
  /**
   * Translate multiple keys at once (for API responses)
   */
  translateBatch(keys: string[], language: string): Record<string, string> {
    return keys.reduce((acc, key) => {
      acc[key] = this.translate(key, language);
      return acc;
    }, {} as Record<string, string>);
  }
  
  /**
   * Get user's preferred language from request
   */
  getLanguageFromRequest(request: Request): string {
    // Check authorization header for user token and get user's language preference
    // Check Accept-Language header
    // Default to English
    return 'en';
  }
}
```

## Translation Management for Content Editors

A translation management UI allows content editors to manage translations:

```typescript
interface TranslationEntry {
  key: string;
  namespace: string;
  defaultValue: string;
  translations: {
    [languageCode: string]: string;
  };
  tags: string[];
  lastUpdated: Date;
  status: 'complete' | 'partial' | 'missing';
}

/**
 * Service for managing translations through the admin UI
 */
export class TranslationManagementService {
  /**
   * Get all translation entries
   */
  async getAllTranslations(filters?: {
    namespace?: string;
    tag?: string;
    status?: 'complete' | 'partial' | 'missing';
    search?: string;
  }): Promise<TranslationEntry[]> {
    // Implementation details...
  }
  
  /**
   * Update a translation
   */
  async updateTranslation(key: string, languageCode: string, value: string): Promise<void> {
    // Implementation details...
  }
  
  /**
   * Add a new translation key
   */
  async addTranslationKey(entry: Omit<TranslationEntry, 'lastUpdated' | 'status'>): Promise<TranslationEntry> {
    // Implementation details...
  }
  
  /**
   * Export translations to JSON files
   */
  async exportTranslations(): Promise<void> {
    // Implementation details...
  }
  
  /**
   * Import translations from JSON files
   */
  async importTranslations(files: Record<string, any>): Promise<void> {
    // Implementation details...
  }
}
```

## Translation Key Extraction

A build-time process extracts translation keys from the source code:

```typescript
// Script to extract translation keys from source files
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

interface ExtractedKey {
  key: string;
  defaultValue?: string;
  file: string;
  line: number;
}

// Find all translation keys in source code
function extractTranslationKeys(sourceDir: string): ExtractedKey[] {
  const files = glob.sync(`${sourceDir}/**/*.{ts,tsx,js,jsx}`);
  const keys: ExtractedKey[] = [];
  
  // Regex patterns for key extraction
  const patterns = [
    // t('key')
    /t\(\s*['"]([^'"]+)['"]\s*(?:,\s*(?:{[^}]*defaultValue:\s*['"]([^'"]+)['"][^}]*})?\s*)?\)/g,
    // useTranslation().t('key')
    /useTranslation\(\)[^]*?\.t\(\s*['"]([^'"]+)['"]\s*(?:,\s*(?:{[^}]*defaultValue:\s*['"]([^'"]+)['"][^}]*})?\s*)?\)/g,
    // <Trans i18nKey="key">Default text</Trans>
    /<Trans\s+i18nKey=['"]([^'"]+)['"][^>]*>([^<]+)<\/Trans>/g
  ];
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const key = match[1];
        const defaultValue = match[2] || '';
        
        // Find line number
        let lineNumber = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(match[0])) {
            lineNumber = i + 1;
            break;
          }
        }
        
        keys.push({
          key,
          defaultValue,
          file: path.relative(process.cwd(), file),
          line: lineNumber
        });
      }
    });
  });
  
  return keys;
}

// Merge extracted keys with existing translations
function mergeWithExistingTranslations(
  extractedKeys: ExtractedKey[],
  translationsDir: string
): void {
  // Get existing translation files
  const langFiles = glob.sync(`${translationsDir}/*.json`);
  
  // Create a map of all keys
  const allKeys = new Map<string, {
    defaultValue?: string;
    references: { file: string; line: number }[];
  }>();
  
  // Add extracted keys to map
  extractedKeys.forEach(({ key, defaultValue, file, line }) => {
    if (allKeys.has(key)) {
      allKeys.get(key)!.references.push({ file, line });
      if (!allKeys.get(key)!.defaultValue && defaultValue) {
        allKeys.get(key)!.defaultValue = defaultValue;
      }
    } else {
      allKeys.set(key, {
        defaultValue,
        references: [{ file, line }]
      });
    }
  });
  
  // Update each language file
  langFiles.forEach(langFile => {
    const langCode = path.basename(langFile, '.json');
    let translations: Record<string, any> = {};
    
    // Load existing translations
    if (fs.existsSync(langFile)) {
      translations = JSON.parse(fs.readFileSync(langFile, 'utf8'));
    }
    
    // Add missing keys
    let hasChanges = false;
    
    allKeys.forEach((value, key) => {
      // Get nested object path for this key
      const keyParts = key.split('.');
      const lastPart = keyParts.pop()!;
      
      // Navigate to the right position in the translations object
      let current = translations;
      for (const part of keyParts) {
        if (current[part] === undefined) {
          current[part] = {};
          hasChanges = true;
        } else if (typeof current[part] !== 'object') {
          // Handle case where a key prefix conflicts with an existing leaf node
          current[part] = { 
            _value: current[part],
            _warning: 'Key namespace conflict'
          };
          hasChanges = true;
        }
        current = current[part];
      }
      
      // Add the translation key if it doesn't exist
      if (current[lastPart] === undefined) {
        // For English, use the default value if available; for others, leave empty
        current[lastPart] = langCode === 'en' && value.defaultValue ? 
          value.defaultValue : '';
        hasChanges = true;
      }
    });
    
    // Write updated translations
    if (hasChanges) {
      fs.writeFileSync(langFile, JSON.stringify(translations, null, 2));
      console.log(`Updated translations for ${langCode}`);
    }
  });
}

// Main execution
const sourceDir = './src';
const translationsDir = './assets/i18n';

const extractedKeys = extractTranslationKeys(sourceDir);
console.log(`Extracted ${extractedKeys.length} translation keys`);

mergeWithExistingTranslations(extractedKeys, translationsDir);
console.log('Translation extraction completed');
```

## Missing Translation Handling

The system includes a mechanism for reporting and handling missing translations:

```typescript
/**
 * Report missing translations for later addition
 */
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

/**
 * Development tool to collect and export missing translations
 */
function exportMissingTranslations(): Record<string, Record<string, any>> {
  return JSON.parse(localStorage.getItem('i18n_missing_keys') || '{}');
}

/**
 * Clear collected missing translations
 */
function clearMissingTranslations(): void {
  localStorage.removeItem('i18n_missing_keys');
}
```

## Integration with Web3Auth and Profile Systems

The translation system integrates with the authentication and profile systems to provide a seamless user experience:

1. **Language Selection During Authentication**:
   - Detect language from browser settings during initial authentication
   - Store language preference in user profile after account creation

2. **Profile Language Integration**:
   - User can set preferred language in profile settings
   - Language preference syncs across devices via profile system
   - Language change updates in real-time without page refresh

3. **Translation in Authenticated Components**:
   - Wallet connection flows are fully translated
   - Security notifications use appropriate language
   - Error messages adapt to user's language

## Translation Testing

The system includes utilities for testing translations:

```typescript
/**
 * Test all translation keys for a component
 */
function testComponentTranslations(
  component: React.ComponentType,
  translationKeys: string[]
): void {
  // For each supported language
  const languages = ['en', 'es', 'fr', 'de', 'zh', 'ar'];
  
  languages.forEach(language => {
    // Setup test environment with language
    const { i18n } = setupTestEnvironment(language);
    
    // Test each key
    translationKeys.forEach(key => {
      const translation = i18n.t(key);
      
      // Should not return the key itself unless it's intentionally the same
      expect(translation).not.toBe(key);
      
      // For right-to-left languages, ensure special characters render correctly
      if (['ar', 'he', 'fa'].includes(language)) {
        // Additional RTL-specific tests
      }
    });
  });
}
```

## Implementation Checklist

- [ ] Create translation file structure with namespaced keys
- [ ] Implement translation loading system for frontend
- [ ] Build server-side translation support
- [ ] Create translation key extraction script
- [ ] Implement translation management UI for content editors
- [ ] Add missing translation reporting mechanism
- [ ] Integrate with profile system for language preferences
- [ ] Set up language detection from browser settings
- [ ] Create translation testing utilities
- [ ] Add translation documentation for developers
- [ ] Implement language switch component with real-time updates
- [ ] Create translation memory for consistent translations
- [ ] Set up automated translation suggestion process
- [ ] Implement translation analytics to track usage and gaps