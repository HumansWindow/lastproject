# World Countries Data

This document provides a comprehensive list of all countries in the world for use with the internationalization (i18n) system. This data is stored in the `/assets/data/countries.json` file and is used throughout the application for country selection, formatting addresses, and other location-based features.

## Countries.json Format

The countries data is structured as follows:

```typescript
interface Country {
  code: string;        // ISO 3166-1 alpha-2 country code
  name: string;        // English name of the country
  nativeName: string;  // Name of the country in its native language
  alpha3: string;      // ISO 3166-1 alpha-3 country code
  numericCode: string; // ISO 3166-1 numeric code
  capital: string;     // Capital city name
  region: string;      // Continent/region
  subregion: string;   // Geographical sub-region
  flag: string;        // Flag emoji
  tld: string[];       // Top-level domain(s)
  currency: {
    code: string;      // Currency code
    name: string;      // Currency name
    symbol: string;    // Currency symbol
  }[];
  languages: {
    code: string;      // ISO 639-1 language code
    name: string;      // Language name
    nativeName: string; // Native name of the language
  }[];
  latlng: number[];    // Latitude and longitude
  callingCodes: string[]; // International calling code(s)
  translations: {      // Country name translations in various languages
    [languageCode: string]: string;
  };
  emoji: string;       // Flag emoji
}
```

## Implementation

The countries.json file should be placed at:

```
/assets/data/countries.json
```

Below is the complete content for the countries.json file with all world countries:

```json
[
  {
    "code": "AF",
    "name": "Afghanistan",
    "nativeName": "افغانستان",
    "alpha3": "AFG",
    "numericCode": "004",
    "capital": "Kabul",
    "region": "Asia",
    "subregion": "Southern Asia",
    "flag": "🇦🇫",
    "tld": [".af"],
    "currency": [{"code": "AFN", "name": "Afghan afghani", "symbol": "؋"}],
    "callingCodes": ["93"],
    "languages": [
      { "code": "ps", "name": "Pashto", "nativeName": "پښتو" },
      { "code": "uz", "name": "Uzbek", "nativeName": "Oʻzbek" },
      { "code": "tk", "name": "Turkmen", "nativeName": "Türkmen" }
    ],
    "latlng": [33, 65],
    "translations": {
      "de": "Afghanistan",
      "es": "Afganistán",
      "fr": "Afghanistan",
      "ja": "アフガニスタン",
      "it": "Afghanistan",
      "br": "Afeganistão",
      "pt": "Afeganistão",
      "nl": "Afghanistan",
      "hr": "Afganistan",
      "fa": "افغانستان",
      "ar": "أفغانستان"
    },
    "emoji": "🇦🇫"
  },
  {
    "code": "AX",
    "name": "Åland Islands",
    "nativeName": "Åland",
    "alpha3": "ALA",
    "numericCode": "248",
    "capital": "Mariehamn",
    "region": "Europe",
    "subregion": "Northern Europe",
    "flag": "🇦🇽",
    "tld": [".ax"],
    "currency": [{"code": "EUR", "name": "Euro", "symbol": "€"}],
    "callingCodes": ["358"],
    "languages": [
      { "code": "sv", "name": "Swedish", "nativeName": "Svenska" }
    ],
    "latlng": [60.116667, 19.9],
    "translations": {
      "de": "Åland",
      "es": "Alandia",
      "fr": "Åland",
      "ja": "オーランド諸島",
      "it": "Isole Aland",
      "br": "Ilhas de Aland",
      "pt": "Ilhas de Aland",
      "nl": "Ålandeilanden",
      "hr": "Ålandski otoci",
      "fa": "جزایر الند",
      "ar": "جزر أولاند"
    },
    "emoji": "🇦🇽"
  },
  {
    "code": "AL",
    "name": "Albania",
    "nativeName": "Shqipëria",
    "alpha3": "ALB",
    "numericCode": "008",
    "capital": "Tirana",
    "region": "Europe",
    "subregion": "Southern Europe",
    "flag": "🇦🇱",
    "tld": [".al"],
    "currency": [{"code": "ALL", "name": "Albanian lek", "symbol": "L"}],
    "callingCodes": ["355"],
    "languages": [
      { "code": "sq", "name": "Albanian", "nativeName": "Shqip" }
    ],
    "latlng": [41, 20],
    "translations": {
      "de": "Albanien",
      "es": "Albania",
      "fr": "Albanie",
      "ja": "アルバニア",
      "it": "Albania",
      "br": "Albânia",
      "pt": "Albânia",
      "nl": "Albanië",
      "hr": "Albanija",
      "fa": "آلبانی",
      "ar": "ألبانيا"
    },
    "emoji": "🇦🇱"
  },
  {
    "code": "DZ",
    "name": "Algeria",
    "nativeName": "الجزائر",
    "alpha3": "DZA",
    "numericCode": "012",
    "capital": "Algiers",
    "region": "Africa",
    "subregion": "Northern Africa",
    "flag": "🇩🇿",
    "tld": [".dz", "الجزائر."],
    "currency": [{"code": "DZD", "name": "Algerian dinar", "symbol": "د.ج"}],
    "callingCodes": ["213"],
    "languages": [
      { "code": "ar", "name": "Arabic", "nativeName": "العربية" }
    ],
    "latlng": [28, 3],
    "translations": {
      "de": "Algerien",
      "es": "Argelia",
      "fr": "Algérie",
      "ja": "アルジェリア",
      "it": "Algeria",
      "br": "Argélia",
      "pt": "Argélia",
      "nl": "Algerije",
      "hr": "Alžir",
      "fa": "الجزایر",
      "ar": "الجزائر"
    },
    "emoji": "🇩🇿"
  },
  {
    "code": "AS",
    "name": "American Samoa",
    "nativeName": "American Samoa",
    "alpha3": "ASM",
    "numericCode": "016",
    "capital": "Pago Pago",
    "region": "Oceania",
    "subregion": "Polynesia",
    "flag": "🇦🇸",
    "tld": [".as"],
    "currency": [{"code": "USD", "name": "United States dollar", "symbol": "$"}],
    "callingCodes": ["1684"],
    "languages": [
      { "code": "en", "name": "English", "nativeName": "English" },
      { "code": "sm", "name": "Samoan", "nativeName": "gagana fa'a Samoa" }
    ],
    "latlng": [-14.33333333, -170],
    "translations": {
      "de": "Amerikanisch-Samoa",
      "es": "Samoa Americana",
      "fr": "Samoa américaines",
      "ja": "アメリカ領サモア",
      "it": "Samoa Americane",
      "br": "Samoa Americana",
      "pt": "Samoa Americana",
      "nl": "Amerikaans Samoa",
      "hr": "Američka Samoa",
      "fa": "ساموآی آمریکا",
      "ar": "ساموا الأمريكية"
    },
    "emoji": "🇦🇸"
  }
]
```

> Note: The above JSON is truncated for brevity. The complete file contains entries for all 249 countries and territories recognized globally.

## Usage with Profile System

The countries data integrates with the profile system to:

1. **Display Country Selection**: For address and location fields in the profile
2. **Format Addresses**: Display addresses in the appropriate format for each country
3. **Phone Number Validation**: Validate phone numbers based on country format
4. **Regional Settings**: Default to appropriate date, time, and number formats based on country

### Example Implementation in Profile Address Form

```tsx
import React, { useState, useEffect } from 'react';
import { useI18n } from '../contexts/i18n-context';

interface Country {
  code: string;
  name: string;
  // ... other fields as defined above
}

export const AddressForm: React.FC = () => {
  const { t, language } = useI18n();
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  
  useEffect(() => {
    // Load countries data
    fetch('/assets/data/countries.json')
      .then(response => response.json())
      .then(data => {
        setCountries(data);
      })
      .catch(error => {
        console.error('Error loading countries:', error);
      });
  }, []);
  
  return (
    <div className="address-form">
      <h2>{t('profile.address.title')}</h2>
      
      <div className="form-group">
        <label htmlFor="country">{t('profile.address.country')}</label>
        <select 
          id="country"
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
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
      
      {/* Address fields vary by country */}
      {selectedCountry && (
        <div className="country-specific-fields">
          {/* Common fields */}
          <div className="form-group">
            <label htmlFor="street">{t('profile.address.street')}</label>
            <input id="street" type="text" />
          </div>
          
          {/* Some countries use states/provinces */}
          {['US', 'CA', 'AU'].includes(selectedCountry) && (
            <div className="form-group">
              <label htmlFor="state">{t(`profile.address.state.${selectedCountry}`)}</label>
              <input id="state" type="text" />
            </div>
          )}
          
          {/* Some countries have postal codes */}
          {!['AO', 'AG', 'AW', 'BS'].includes(selectedCountry) && (
            <div className="form-group">
              <label htmlFor="postalCode">
                {t(`profile.address.postalCode.${selectedCountry}`, {
                  fallback: t('profile.address.postalCode.default')
                })}
              </label>
              <input id="postalCode" type="text" />
            </div>
          )}
          
          {/* Phone with country code */}
          <div className="form-group phone-group">
            <label htmlFor="phone">{t('profile.address.phone')}</label>
            <div className="phone-input-group">
              <span className="country-code">
                +{countries.find(c => c.code === selectedCountry)?.callingCodes[0] || ''}
              </span>
              <input id="phone" type="tel" />
            </div>
          </div>
        </div>
      )}
      
      <button type="submit">{t('common.buttons.save')}</button>
    </div>
  );
};
```

## Data Sources and Maintenance

The countries data is sourced from:

1. **ISO 3166-1**: Standard for country codes and names
2. **Unicode CLDR**: Common Locale Data Repository for translations and formatting
3. **UN Statistics Division**: For geographical classifications

The data should be updated periodically to reflect:
- Country name changes
- New country formations
- Changes in currency
- Changes in calling codes
- Updates to TLDs

A scheduled maintenance task should check for updates to these standards at least annually.

## Implementation Checklist

- [ ] Create countries.json file with all 249 countries and territories
- [ ] Verify all country codes match ISO 3166-1 standards
- [ ] Add flag emoji and images for all countries
- [ ] Implement country filtering by region/continent
- [ ] Add translations for all country names in supported languages
- [ ] Create country-specific address formatters
- [ ] Integrate with profile system for address storage
- [ ] Add phone number validation based on country formats
- [ ] Implement customized address input fields based on selected country