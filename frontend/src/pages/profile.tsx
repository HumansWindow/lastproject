import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from "../contexts/AuthProvider";
import { useWallet } from "../contexts/WalletProvider";
import { WalletConnectButton } from "../components/WalletConnectButton";
import { ProfileOnboarding } from "../components/ProfileOnboarding"; 
import { LocationDetector } from "../components/LocationDetector";
import { UserProfile } from "@/types/apiTypes";
import { profileService } from "@/profile/profileService";

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, updateUserProfile, isProfileComplete } = useAuth();
  const { walletInfo } = useWallet();
  
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
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showLocationDetector, setShowLocationDetector] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  
  // Initialize form with user data once loaded
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        bio: user.bio || '',
        country: user.country || '',
        city: user.city || '',
        language: user.language || '',
        timezone: user.timezone || '',
      });
      
      // Show location detector if country or language is missing
      if (!user.country || !user.language) {
        setShowLocationDetector(true);
      }
    }
  }, [user]);
  
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
    // Update form data with detected location
    setFormData(prev => ({
      ...prev,
      country: locationData.country || prev.country,
      city: locationData.city || prev.city,
      timezone: locationData.timezone || prev.timezone,
      language: locationData.language || prev.language,
    }));
    
    // Hide the detector after confirmation
    setShowLocationDetector(false);
    
    // Show success message
    setSuccessMessage('Location and language detected and applied');
    
    // Auto-save the detected data if user is already logged in
    if (user?.id && isAuthenticated) {
      handleAutoSaveLocationData(locationData);
    }
  };
  
  const handleAutoSaveLocationData = async (locationData: {
    country?: string;
    city?: string;
    timezone?: string;
    language?: string;
  }) => {
    try {
      setIsDetectingLocation(true);
      await updateUserProfile({
        country: locationData.country,
        city: locationData.city,
        timezone: locationData.timezone,
        language: locationData.language,
      });
      console.log('Auto-saved location data to profile');
    } catch (err) {
      console.error('Failed to auto-save location data:', err);
      // Don't show error to user as this is automatic
    } finally {
      setIsDetectingLocation(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const success = await updateUserProfile(formData);
      
      if (success) {
        setSuccessMessage('Profile updated successfully');
      } else {
        setError('Failed to update profile');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCompleteLater = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await profileService.markCompleteLater();
      setSuccessMessage('Profile marked as complete later');
      // Refresh the page after a short delay to show the success message
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDetectLocation = () => {
    setShowLocationDetector(true);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }
  
  // Show the location detector modal if needed
  if (showLocationDetector && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <LocationDetector
          onLocationConfirmed={handleLocationDetected}
          onSkip={() => setShowLocationDetector(false)}
          showSkip={true}
          className="w-full max-w-md"
        />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">User Profile</h1>
      
      {!isAuthenticated ? (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Connect Wallet to Continue</h2>
          <p className="mb-6">
            Please connect your wallet to access your profile. We use your wallet for secure authentication.
          </p>
          <WalletConnectButton className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition" />
        </div>
      ) : !isProfileComplete ? (
        <ProfileOnboarding onCompleteLater={handleCompleteLater} />
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Wallet Information</h2>
            <div className="bg-gray-100 p-4 rounded">
              <p><strong>Address:</strong> {walletInfo?.address}</p>
              <p><strong>Chain:</strong> {walletInfo?.blockchain || walletInfo?.chainId}</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}
            
            {successMessage && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
                {successMessage}
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
                  required
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
                  required
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
              <p className="text-sm text-gray-500 mt-1">Email is optional but recommended for notifications and recovery options</p>
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
                rows={4}
              ></textarea>
            </div>
            
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;