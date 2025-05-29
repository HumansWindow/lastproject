import React, { useEffect, useState } from 'react';
import { GeoLocationData } from "@/profile/profileService";
import { locationService } from "@/services/location/location-service";
import { Select, Button, Alert, Spinner } from "../components/ui";

interface LocationDetectorProps {
  onLocationConfirmed: (locationData: {
    country?: string;
    city?: string;
    timezone?: string;
    language?: string;
  }) => void;
  onSkip?: () => void;
  showSkip?: boolean;
  className?: string;
}

// Lists of supported languages and common countries
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'de', name: 'German' },
  { code: 'fa', name: 'Persian' },
  // Add more languages as needed
];

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'IR', name: 'Iran' },
  // Add more countries as needed
];

export const LocationDetector: React.FC<LocationDetectorProps> = ({
  onLocationConfirmed,
  onSkip,
  showSkip = true,
  className = '',
}) => {
  const [detectedLocation, setDetectedLocation] = useState<GeoLocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state for user-confirmed values
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedTimezone, setSelectedTimezone] = useState<string>('');
  
  // Detect location on component mount
  useEffect(() => {
    detectUserLocation();
  }, []);

  // Auto-populate form fields when detection completes
  useEffect(() => {
    if (detectedLocation) {
      setSelectedCountry(detectedLocation.country ?? '');
      setSelectedLanguage(detectedLocation.language ?? 'en');
      setSelectedCity(detectedLocation.city ?? '');
      setSelectedTimezone(detectedLocation.timezone ?? '');
    }
  }, [detectedLocation]);

  // Function to detect location
  const detectUserLocation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Updated to use the new locationService
      const locationData = await locationService.detectLocation();
      setDetectedLocation(locationData);
    } catch (err) {
      console.error('Failed to detect location:', err);
      setError('Unable to detect your location automatically. Please select manually.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle confirmation of detected/selected location
  const handleConfirmLocation = () => {
    const locationData = {
      country: selectedCountry,
      city: selectedCity,
      timezone: selectedTimezone,
      language: selectedLanguage,
    };
    
    // Save location preferences using the service
    locationService.saveLocationPreferences(locationData)
      .catch(err => console.error('Failed to save location preferences:', err));
      
    // Call the callback provided by parent component
    onLocationConfirmed(locationData);
  };

  // Handle manual retry of detection
  const handleRetryDetection = () => {
    detectUserLocation();
  };

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
        <Spinner size="lg" />
        <p className="mt-2 text-gray-600">Detecting your location...</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h2 className="text-xl font-semibold mb-4">Confirm Your Location & Language</h2>
      
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}
      
      {detectedLocation && !error && (
        <div className="mb-4">
          <Alert variant="info">
            We detected your location as {detectedLocation.country ?? 'Unknown'} 
            and preferred language as {LANGUAGES.find(l => l.code === detectedLocation.language)?.name ?? 'English'}.
            Please confirm or update below.
          </Alert>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
            Language
          </label>
          <Select
            id="language"
            value={selectedLanguage}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedLanguage(e.target.value)}
            className="w-full"
          >
            <option value="">Select language</option>
            {LANGUAGES.map(language => (
              <option key={language.code} value={language.code}>
                {language.name}
              </option>
            ))}
          </Select>
        </div>
        
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <Select
            id="country"
            value={selectedCountry}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCountry(e.target.value)}
            className="w-full"
          >
            <option value="">Select country</option>
            {COUNTRIES.map(country => (
              <option key={country.code} value={country.name}>
                {country.name}
              </option>
            ))}
          </Select>
        </div>
        
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            City (Optional)
          </label>
          <input
            type="text"
            id="city"
            value={selectedCity}
            onChange={e => setSelectedCity(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Your city"
          />
        </div>
        
        <div className="flex space-x-3 mt-6">
          <Button 
            onClick={handleConfirmLocation} 
            disabled={!selectedCountry || !selectedLanguage}
            className="flex-1"
          >
            Confirm
          </Button>
          
          {error && (
            <Button 
              onClick={handleRetryDetection} 
              variant="outline"
            >
              Retry Detection
            </Button>
          )}
          
          {showSkip && onSkip && (
            <Button 
              onClick={onSkip} 
              variant="link"
              className="text-gray-500"
            >
              Skip for now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationDetector;