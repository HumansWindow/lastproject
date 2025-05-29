# Formatting and Localization

This document outlines the implementation of formatting and localization features for the internationalization (i18n) system. These utilities handle formatting dates, numbers, currencies, and other locale-specific data presentation across different languages and regions.

## Core Formatting Features

The formatting system provides consistent localization across the application for:

1. **Dates and Times**: Display dates and times in culturally appropriate formats
2. **Numbers**: Format numbers with proper decimal and thousand separators
3. **Currencies**: Format monetary values with correct symbols and placement
4. **Units**: Format measurements with appropriate units and conversions
5. **Relative Times**: Express time differences in natural language ("3 days ago")
6. **Lists**: Format lists according to language conventions
7. **Pluralization**: Handle plural forms correctly across languages

## Integration with i18n System

The formatting system integrates with the broader i18n system by:

1. Using the current language from the i18n context
2. Respecting the user's profile preferences for date/time formats
3. Using country-specific formatting rules where appropriate
4. Supporting both client-side and server-side formatting

## Formatting Configuration Interface

```typescript
interface FormattingConfig {
  // User preferences that override defaults
  dateFormat: 'short' | 'medium' | 'long' | 'full' | string;
  timeFormat: '12h' | '24h' | string;
  firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.
  currencyDisplay: 'symbol' | 'code' | 'name';
  numberFormat: {
    minimumFractionDigits: number;
    maximumFractionDigits: number;
    useGrouping: boolean; // Whether to use thousand separators
  };
  
  // System settings
  fallbackLocale: string;
  timezone: string; // User's timezone from profile or auto-detected
}
```

## Core Formatting Functions

### Date Formatting

```typescript
/**
 * Format a date according to the user's locale and preferences
 */
function formatDate(
  date: Date | string | number,
  options?: {
    format?: 'short' | 'medium' | 'long' | 'full' | string;
    timezone?: string;
  }
): string {
  const { language } = useI18n();
  const { profile } = useProfile();
  
  // Get date format preference from options, profile, or default
  const format = options?.format || profile?.dateFormat || 'medium';
  
  // Get timezone from options, profile, or system
  const timezone = options?.timezone || profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Convert input to Date object
  const dateObj = typeof date === 'object' ? date : new Date(date);
  
  // Handle custom format strings
  if (format !== 'short' && format !== 'medium' && format !== 'long' && format !== 'full') {
    return formatDateWithTemplate(dateObj, format, language, timezone);
  }
  
  // Use Intl.DateTimeFormat for standard formats
  const formatOptions: Intl.DateTimeFormatOptions = { 
    timeZone: timezone 
  };
  
  // Set format based on selected style
  switch (format) {
    case 'short':
      formatOptions.dateStyle = 'short';
      break;
    case 'medium':
      formatOptions.dateStyle = 'medium';
      break;
    case 'long':
      formatOptions.dateStyle = 'long';
      break;
    case 'full':
      formatOptions.dateStyle = 'full';
      break;
  }
  
  return new Intl.DateTimeFormat(language, formatOptions).format(dateObj);
}

/**
 * Format a date with a custom template pattern
 * Supports: yyyy, MM, dd, HH, mm, ss, etc.
 */
function formatDateWithTemplate(
  date: Date,
  template: string,
  locale: string,
  timezone: string
): string {
  // Create formatter for each component
  const options: Intl.DateTimeFormatOptions = { timeZone: timezone };
  const formatters = {
    yyyy: new Intl.DateTimeFormat(locale, { ...options, year: 'numeric' }),
    yy: new Intl.DateTimeFormat(locale, { ...options, year: '2-digit' }),
    MMMM: new Intl.DateTimeFormat(locale, { ...options, month: 'long' }),
    MMM: new Intl.DateTimeFormat(locale, { ...options, month: 'short' }),
    MM: new Intl.DateTimeFormat(locale, { ...options, month: '2-digit' }),
    dd: new Intl.DateTimeFormat(locale, { ...options, day: '2-digit' }),
    d: new Intl.DateTimeFormat(locale, { ...options, day: 'numeric' }),
    EEEE: new Intl.DateTimeFormat(locale, { ...options, weekday: 'long' }),
    EEE: new Intl.DateTimeFormat(locale, { ...options, weekday: 'short' }),
    HH: new Intl.DateTimeFormat(locale, { ...options, hour: '2-digit', hour12: false }),
    hh: new Intl.DateTimeFormat(locale, { ...options, hour: '2-digit', hour12: true }),
    mm: new Intl.DateTimeFormat(locale, { ...options, minute: '2-digit' }),
    ss: new Intl.DateTimeFormat(locale, { ...options, second: '2-digit' }),
    a: new Intl.DateTimeFormat(locale, { ...options, hour: 'numeric', hour12: true })
  };
  
  // Replace each token in the template
  let result = template;
  for (const [token, formatter] of Object.entries(formatters)) {
    const parts = formatter.formatToParts(date);
    const value = parts.find(part => {
      if (token === 'a') return part.type === 'dayPeriod';
      if (token === 'MMMM' || token === 'MMM') return part.type === 'month';
      if (token === 'EEEE' || token === 'EEE') return part.type === 'weekday';
      
      const tokenType = token.charAt(0) === 'y' ? 'year' : 
                        token.charAt(0) === 'M' ? 'month' :
                        token.charAt(0) === 'd' ? 'day' :
                        token.charAt(0) === 'H' || token.charAt(0) === 'h' ? 'hour' :
                        token.charAt(0) === 'm' ? 'minute' : 'second';
      return part.type === tokenType;
    })?.value || '';
    
    result = result.replace(token, value);
  }
  
  return result;
}
```

### Time Formatting

```typescript
/**
 * Format a time according to the user's locale and preferences
 */
function formatTime(
  time: Date | string | number,
  options?: {
    format?: '12h' | '24h' | 'short' | 'medium' | 'long';
    includeSeconds?: boolean;
    timezone?: string;
  }
): string {
  const { language } = useI18n();
  const { profile } = useProfile();
  
  // Get time format preference from options, profile, or default
  const format = options?.format || profile?.timeFormat || '24h';
  
  // Get timezone from options, profile, or system
  const timezone = options?.timezone || profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Convert input to Date object
  const dateObj = typeof time === 'object' ? time : new Date(time);
  
  // Format based on preferences
  const formatOptions: Intl.DateTimeFormatOptions = { 
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit'
  };
  
  // Set hour12 based on format preference
  if (format === '12h') {
    formatOptions.hour12 = true;
  } else if (format === '24h') {
    formatOptions.hour12 = false;
  }
  
  // Include seconds if requested
  if (options?.includeSeconds) {
    formatOptions.second = '2-digit';
  }
  
  // Handle special format styles
  if (['short', 'medium', 'long'].includes(format)) {
    formatOptions.timeStyle = format as 'short' | 'medium' | 'long';
  }
  
  return new Intl.DateTimeFormat(language, formatOptions).format(dateObj);
}
```

### Number Formatting

```typescript
/**
 * Format a number according to the user's locale
 */
function formatNumber(
  value: number,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    useGrouping?: boolean;
    style?: 'decimal' | 'percent' | 'unit';
    unit?: string;
  }
): string {
  const { language } = useI18n();
  const { profile } = useProfile();
  
  // Merge options with defaults and user preferences
  const formatOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: options?.minimumFractionDigits ?? profile?.numberFormat?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? profile?.numberFormat?.maximumFractionDigits ?? 2,
    useGrouping: options?.useGrouping ?? profile?.numberFormat?.useGrouping ?? true
  };
  
  // Add style and unit if provided
  if (options?.style) {
    formatOptions.style = options.style;
    
    if (options.style === 'unit' && options.unit) {
      formatOptions.unit = options.unit;
      formatOptions.unitDisplay = 'long';
    }
  }
  
  return new Intl.NumberFormat(language, formatOptions).format(value);
}
```

### Currency Formatting

```typescript
/**
 * Format a monetary value according to the user's locale and preferences
 */
function formatCurrency(
  amount: number,
  options?: {
    currency?: string;
    display?: 'symbol' | 'code' | 'name';
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const { language } = useI18n();
  const { profile } = useProfile();
  
  // Get currency from options, user's country, or default
  const currency = options?.currency || 
    (profile?.country ? getCurrencyForCountry(profile.country) : 'USD');
  
  // Get display preference
  const currencyDisplay = options?.display || profile?.currencyDisplay || 'symbol';
  
  // Format the currency
  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency,
    currencyDisplay,
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2
  }).format(amount);
}

/**
 * Get the default currency for a country
 */
function getCurrencyForCountry(countryCode: string): string {
  // Load from country data in the application
  const countryData = getCountryByCode(countryCode);
  if (countryData?.currency?.[0]?.code) {
    return countryData.currency[0].code;
  }
  
  // Fallback map for common currencies
  const countryCurrencyMap: Record<string, string> = {
    'US': 'USD',
    'CA': 'CAD',
    'GB': 'GBP',
    'EU': 'EUR',
    'JP': 'JPY',
    'CN': 'CNY',
    'AU': 'AUD',
    'CH': 'CHF',
    'IN': 'INR'
    // Add more countries as needed
  };
  
  return countryCurrencyMap[countryCode] || 'USD';
}
```

### Relative Time Formatting

```typescript
/**
 * Format a date as a relative time (e.g., "2 hours ago", "in 3 days")
 */
function formatRelativeTime(
  date: Date | string | number,
  options?: {
    style?: 'long' | 'short' | 'narrow';
    now?: Date;
  }
): string {
  const { language } = useI18n();
  
  // Convert inputs to Date objects
  const targetDate = typeof date === 'object' ? date : new Date(date);
  const now = options?.now || new Date();
  
  // Calculate the difference in seconds
  const diffSeconds = Math.floor((targetDate.getTime() - now.getTime()) / 1000);
  const absoluteDiffSeconds = Math.abs(diffSeconds);
  
  // Determine the appropriate unit
  let unit: Intl.RelativeTimeFormatUnit;
  let value: number;
  
  if (absoluteDiffSeconds < 60) {
    unit = 'second';
    value = diffSeconds;
  } else if (absoluteDiffSeconds < 3600) {
    unit = 'minute';
    value = Math.floor(diffSeconds / 60);
  } else if (absoluteDiffSeconds < 86400) {
    unit = 'hour';
    value = Math.floor(diffSeconds / 3600);
  } else if (absoluteDiffSeconds < 2592000) {
    unit = 'day';
    value = Math.floor(diffSeconds / 86400);
  } else if (absoluteDiffSeconds < 31536000) {
    unit = 'month';
    value = Math.floor(diffSeconds / 2592000);
  } else {
    unit = 'year';
    value = Math.floor(diffSeconds / 31536000);
  }
  
  // Format the relative time
  const formatter = new Intl.RelativeTimeFormat(language, {
    style: options?.style || 'long',
    numeric: 'auto'
  });
  
  return formatter.format(value, unit);
}
```

## Pluralization

Different languages have different rules for pluralization. The i18n system handles this with a pluralization function:

```typescript
/**
 * Format a message with proper pluralization
 */
function plural(
  count: number,
  options: {
    zero?: string;
    one: string;
    other: string;
    many?: string;
    few?: string;
    two?: string;
  }
): string {
  const { language } = useI18n();
  
  // Get the plural rule for this language
  const pluralRules = new Intl.PluralRules(language);
  const category = pluralRules.select(count);
  
  // Get the appropriate message based on the plural category
  const message = options[category] || options.other;
  
  // Replace {count} with the actual number
  return message.replace('{count}', String(count));
}
```

## List Formatting

```typescript
/**
 * Format a list of items according to locale conventions
 */
function formatList(
  items: string[],
  options?: {
    style?: 'long' | 'short' | 'narrow';
    type?: 'conjunction' | 'disjunction' | 'unit';
  }
): string {
  const { language } = useI18n();
  
  const formatter = new Intl.ListFormat(language, {
    style: options?.style || 'long',
    type: options?.type || 'conjunction'
  });
  
  return formatter.format(items);
}
```

## Server-side Formatting

For server-side rendering or API responses that need to be pre-formatted:

```typescript
// In backend services
export class FormattingService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService
  ) {}
  
  /**
   * Format data for a specific user
   */
  async formatForUser(userId: string, data: any): Promise<any> {
    // Get user's profile and preferences
    const profile = await this.userService.getUserProfile(userId);
    
    // Deep clone data to avoid modifying the original
    const result = JSON.parse(JSON.stringify(data));
    
    // Format all date fields
    this.formatDateFieldsForUser(result, profile);
    
    // Format all number and currency fields
    this.formatNumberFieldsForUser(result, profile);
    
    return result;
  }
  
  /**
   * Format a date for a specific user
   */
  formatDateForUser(
    date: Date | string,
    userId: string,
    format?: string
  ): Promise<string> {
    // Implementation details...
  }
  
  /**
   * Format a number for a specific user
   */
  formatNumberForUser(
    number: number,
    userId: string,
    options?: any
  ): Promise<string> {
    // Implementation details...
  }
  
  // Additional formatting methods...
}
```

## Integration with Translation System

The formatting system works hand-in-hand with the translation system:

```typescript
// Using both systems together
function displayProductInfo(product: Product): string {
  const { t } = useI18n();
  
  return t('product.infoWithPrice', {
    interpolation: {
      name: product.name,
      price: formatCurrency(product.price),
      date: formatDate(product.releaseDate),
      count: product.stock,
      countText: plural(product.stock, {
        zero: t('common.outOfStock'),
        one: t('common.lastItemInStock'),
        other: t('common.itemsInStock', { interpolation: { count: product.stock } })
      })
    }
  });
}
```

## Implementation Checklist

- [ ] Implement base formatting functions for dates, times, numbers, and currencies
- [ ] Create pluralization system for language-specific plural rules
- [ ] Build relative time formatting with proper grammatical rules
- [ ] Implement list formatting for different languages
- [ ] Create server-side formatting service for APIs
- [ ] Add unit tests for all formatting functions across languages
- [ ] Integrate formatting with the translation system
- [ ] Create formatting configuration options in user profiles
- [ ] Add documentation and examples for developers
- [ ] Create demo page showing formatting across different locales