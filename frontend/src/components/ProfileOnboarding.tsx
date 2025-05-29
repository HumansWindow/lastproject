import React, { useState, useEffect } from 'react';
import { UserProfile } from "@/types/apiTypes";
import { useAuth } from "../contexts/AuthProvider";
import { profileService } from "../profile/profileService";
import { useRouter } from 'next/router';
import { LocationDetector } from "./LocationDetector";

interface ProfileOnboardingProps {
  onComplete?: () => void;
  onCompleteLater?: () => void;
}

export const ProfileOnboarding: React.FC<ProfileOnboardingProps> = ({ 
  onComplete,
  onCompleteLater 
}) => {
  const { completeUserProfile, isLoading } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    bio: '',
    country: '',
    city: '',
    language: '',
    timezone: '',
  });
  
  const [error, setError] = useState<string | null>(null);
  const [isCompletingLater, setIsCompletingLater] = useState(false);
  const [showLocationDetector, setShowLocationDetector] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  
  // Check for location detection on component mount
  useEffect(() => {
    // Show location detector on first load
    if (!locationDetected && !formData.country && !formData.language) {
      setShowLocationDetector(true);
    }
  }, [locationDetected, formData.country, formData.language]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleLocationDetected = (locationData: {
    country?: string;
    city?: string;
    timezone?: string;
    language?: string;
  }) => {
    // Update form with detected location
    setFormData(prev => ({
      ...prev,
      country: locationData.country || prev.country,
      city: locationData.city || prev.city,
      timezone: locationData.timezone || prev.timezone,
      language: locationData.language || prev.language,
    }));
    
    setLocationDetected(true);
    setShowLocationDetector(false);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      const success = await completeUserProfile(formData);
      
      if (success) {
        if (onComplete) {
          onComplete();
        } else {
          router.push('/');
        }
      } else {
        setError('Failed to update profile');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };
  
  const handleCompleteLater = async () => {
    setIsCompletingLater(true);
    setError(null);
    
    try {
      // If we detected location, save it even when completing later
      if (locationDetected) {
        await profileService.completeProfileWithLocation({
          ...formData,
          completeLater: true
        });
      } else {
        await profileService.markCompleteLater();
      }
      
      if (onCompleteLater) {
        onCompleteLater();
      } else if (onComplete) {
        onComplete();
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setIsCompletingLater(false);
    }
  };

  const handleDetectLocation = () => {
    setShowLocationDetector(true);
  };
  
  // Show location detector if requested
  if (showLocationDetector) {
    return (
      <LocationDetector
        onLocationConfirmed={handleLocationDetected}
        onSkip={() => setShowLocationDetector(false)}
        showSkip={true}
        className="w-full max-w-md mx-auto"
      />
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Complete Your Profile</h2>
      <p className="mb-6">All fields are optional. You can complete your profile later if you prefer.</p>
      
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 font-medium">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block mb-1 font-medium">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email || ''}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-1 font-medium">Phone Number</label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber || ''}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 font-medium">Country</label>
            <input
              type="text"
              name="country"
              value={formData.country || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block mb-1 font-medium">City</label>
            <input
              type="text"
              name="city"
              value={formData.city || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 font-medium">Language</label>
            <select
              name="language"
              value={formData.language || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Select language</option>
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="es">Spanish</option>
              <option value="de">German</option>
              <option value="fa">Persian</option>
            </select>
          </div>
          
          <div>
            <label className="block mb-1 font-medium">Timezone</label>
            <input
              type="text"
              name="timezone"
              value={formData.timezone || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        
        {(!formData.country || !formData.language) && (
          <div className="mb-4">
            <button
              type="button"
              onClick={handleDetectLocation}
              className="w-full py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
            >
              Auto-detect Country & Language
            </button>
          </div>
        )}
        
        <div className="mb-4">
          <label className="block mb-1 font-medium">Bio</label>
          <textarea
            name="bio"
            value={formData.bio || ''}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            rows={3}
          ></textarea>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <button
            type="submit"
            className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            disabled={isLoading || isCompletingLater}
          >
            {isLoading ? 'Saving...' : 'Save Profile'}
          </button>
          
          <button
            type="button"
            onClick={handleCompleteLater}
            className="flex-1 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
            disabled={isLoading || isCompletingLater}
          >
            {isCompletingLater ? 'Processing...' : 'Complete Later'}
          </button>
        </div>
      </form>
    </div>
  );
};