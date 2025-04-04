import React, { useState, useEffect } from 'react';
import { Diary, DiaryLocation, DiaryLocationLabels, FeelingOptions } from '../../types/diary';
import { diaryService } from '../../services/diary.service';
import RichTextEditor from './RichTextEditor';
import MediaRecorderComponent from './MediaRecorder';
import { storeEncryptedMedia } from '../../utils/encryption';
import { useRouter } from 'next/router';

interface DiaryFormProps {
  initialData?: Diary;
  isEdit?: boolean;
  onSubmitSuccess?: (diary: Diary) => void;
}

const DiaryForm: React.FC<DiaryFormProps> = ({ 
  initialData, 
  isEdit = false, 
  onSubmitSuccess 
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Diary>(
    initialData || {
      title: '',
      gameLevel: 1,
      location: DiaryLocation.OTHER,
      content: '',
      hasMedia: false,
      isStoredLocally: true,
    }
  );
  const [showMediaRecorder, setShowMediaRecorder] = useState<boolean>(false);
  const [mediaBlobs, setMediaBlobs] = useState<{
    audio?: { blob: Blob, encrypted?: ArrayBuffer },
    video?: { blob: Blob, encrypted?: ArrayBuffer }
  }>({});
  const [locationOptions, setLocationOptions] = useState<DiaryLocation[]>(
    Object.values(DiaryLocation)
  );

  // Fetch available locations from the backend
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const locations = await diaryService.getLocations();
        setLocationOptions(locations);
      } catch (err) {
        console.error('Failed to fetch diary locations:', err);
      }
    };

    fetchLocations();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Handle number input specially
    if (name === 'gameLevel') {
      setFormData({
        ...formData,
        [name]: parseInt(value, 10) || 1,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleContentChange = (content: string) => {
    setFormData({
      ...formData,
      content,
    });
  };

  const handleMediaCaptured = (blob: Blob, type: 'audio' | 'video', encryptedData?: ArrayBuffer) => {
    // Store the blob and encrypted data
    setMediaBlobs((prev) => ({
      ...prev,
      [type]: {
        blob,
        encrypted: encryptedData
      }
    }));
    
    // Update the hasMedia flag
    setFormData({
      ...formData,
      hasMedia: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let savedDiary: Diary;

      if (isEdit && initialData?.id) {
        // Update existing diary entry
        savedDiary = await diaryService.updateDiary(initialData.id, formData);
      } else {
        // Create new diary entry
        savedDiary = await diaryService.createDiary(formData);
      }

      // If we have media and diary was saved, store encrypted media locally
      if (formData.hasMedia && formData.isStoredLocally && savedDiary.id) {
        // Store audio if available
        if (mediaBlobs.audio?.encrypted) {
          const audioKey = window.crypto.getRandomValues(new Uint8Array(32));
          storeEncryptedMedia(
            savedDiary.id,
            'audio',
            mediaBlobs.audio.encrypted,
            audioKey
          );
        }

        // Store video if available
        if (mediaBlobs.video?.encrypted) {
          const videoKey = window.crypto.getRandomValues(new Uint8Array(32));
          storeEncryptedMedia(
            savedDiary.id,
            'video',
            mediaBlobs.video.encrypted,
            videoKey
          );
        }
      }

      if (onSubmitSuccess) {
        onSubmitSuccess(savedDiary);
      } else {
        // Navigate to diary list on success
        router.push('/diary');
      }
    } catch (err: any) {
      console.error('Failed to save diary:', err);
      setError(err.response?.data?.message || 'Failed to save diary entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="diary-form-container">
      <h2>{isEdit ? 'Edit Diary Entry' : 'Create New Diary Entry'}</h2>
      
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="title" className="form-label">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            className="form-control"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="gameLevel" className="form-label">Game Level</label>
          <input
            type="number"
            id="gameLevel"
            name="gameLevel"
            className="form-control"
            min="1"
            value={formData.gameLevel}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="location" className="form-label">Where it happened</label>
          <select
            id="location"
            name="location"
            className="form-select"
            value={formData.location}
            onChange={handleInputChange}
            required
          >
            {locationOptions.map((location) => (
              <option key={location} value={location}>
                {DiaryLocationLabels[location]}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-3">
          <label htmlFor="feeling" className="form-label">How did you feel?</label>
          <div className="feeling-selector">
            {FeelingOptions.map(feeling => (
              <div 
                key={feeling.value} 
                className={`feeling-option ${formData.feeling === feeling.value ? 'selected' : ''}`}
                onClick={() => setFormData({...formData, feeling: feeling.value})}
              >
                <span className="feeling-emoji">{feeling.emoji}</span>
                <span className="feeling-label">{feeling.label}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-3">
          <label htmlFor="color" className="form-label">Choose a Color</label>
          <input
            type="color"
            id="color"
            name="color"
            className="form-control form-control-color"
            value={formData.color || '#ffffff'}
            onChange={handleInputChange}
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="content" className="form-label">Content</label>
          <RichTextEditor
            value={formData.content}
            onChange={handleContentChange}
          />
        </div>
        
        <div className="mb-3">
          <div className="form-check">
            <input
              type="checkbox"
              id="isStoredLocally"
              name="isStoredLocally"
              className="form-check-input"
              checked={formData.isStoredLocally}
              onChange={(e) => setFormData({
                ...formData, 
                isStoredLocally: e.target.checked
              })}
            />
            <label className="form-check-label" htmlFor="isStoredLocally">
              Store locally (encrypted)
            </label>
          </div>
        </div>
        
        <div className="mb-4">
          <button 
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowMediaRecorder(!showMediaRecorder)}
          >
            {showMediaRecorder ? 'Hide Media Recorder' : 'Add Audio/Video'}
          </button>
          
          {showMediaRecorder && (
            <div className="mt-2">
              <MediaRecorderComponent onMediaCaptured={handleMediaCaptured} />
              
              {/* Preview captured media */}
              <div className="media-preview">
                {mediaBlobs.audio?.blob && (
                  <div className="audio-preview mt-2">
                    <h5>Audio Preview</h5>
                    <audio controls src={URL.createObjectURL(mediaBlobs.audio.blob)} />
                  </div>
                )}
                
                {mediaBlobs.video?.blob && (
                  <div className="video-preview mt-2">
                    <h5>Video Preview</h5>
                    <video 
                      controls 
                      src={URL.createObjectURL(mediaBlobs.video.blob)}
                      style={{ maxWidth: '100%', maxHeight: '300px' }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="d-flex justify-content-between">
          <button 
            type="button" 
            className="btn btn-outline-secondary"
            onClick={() => router.push('/diary')}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Save'}
          </button>
        </div>
      </form>
      
      <style>{`
        .feeling-selector {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 10px;
        }
        
        .feeling-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 70px;
          height: 70px;
          border-radius: 8px;
          border: 1px solid #ddd;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .feeling-option:hover {
          background-color: #f5f5f5;
          transform: translateY(-2px);
        }
        
        .feeling-option.selected {
          border: 2px solid #0d6efd;
          background-color: #e7f1ff;
        }
        
        .feeling-emoji {
          font-size: 1.8rem;
          margin-bottom: 5px;
        }
        
        .feeling-label {
          font-size: 0.8rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default DiaryForm;