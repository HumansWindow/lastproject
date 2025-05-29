import React, { useEffect, useState, useCallback } from 'react';
import { NextPage } from 'next';
import Layout from "../../components/layout/Layout";
import { useRouter } from 'next/router';
import { diaryService } from "../../services/api/modules/diary";
import { Diary } from "../../types/diary";
import { DiaryLocationLabels, FeelingOptions, ExtendedDiary } from "../../types/diaryExtended";
import Link from 'next/link';
import { format } from 'date-fns';
import { retrieveEncryptedMedia } from "../../utils/encryption";

const DiaryDetailPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [diary, setDiary] = useState<ExtendedDiary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mediaUrls, setMediaUrls] = useState<{
    audio?: string;
    video?: string;
  }>({});

  const fetchDiary = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await diaryService.getDiaryEntry(id as string);
      // Convert DiaryEntry to ExtendedDiary by ensuring location property is compatible
      const extendedDiary: ExtendedDiary = {
        ...response,
        location: typeof response.location === 'string' 
          ? response.location
          : (response.location || { name: 'Unknown', latitude: 0, longitude: 0 })
      };
      setDiary(extendedDiary);
      
      // If the diary has media and is stored locally, try to load it
      if (extendedDiary.hasMedia && extendedDiary.isStoredLocally) {
        loadLocalMedia(extendedDiary.id);
      }
    } catch (error) {
      console.error('Error fetching diary entry:', error);
      setError('Failed to load diary entry');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDiary();
  }, [fetchDiary]);

  const loadLocalMedia = (diaryId: string) => {
    // Try to load audio
    try {
      const audioData = retrieveEncryptedMedia(diaryId, 'audio');
      if (audioData) {
        const audioBlob = new Blob([audioData.data], { type: 'audio/webm' });
        setMediaUrls(prev => ({
          ...prev,
          audio: URL.createObjectURL(audioBlob)
        }));
      }
    } catch (e) {
      console.error('Failed to load audio:', e);
    }
    
    // Try to load video
    try {
      const videoData = retrieveEncryptedMedia(diaryId, 'video');
      if (videoData) {
        const videoBlob = new Blob([videoData.data], { type: 'video/webm' });
        setMediaUrls(prev => ({
          ...prev,
          video: URL.createObjectURL(videoBlob)
        }));
      }
    } catch (e) {
      console.error('Failed to load video:', e);
    }
  };

  const handleDelete = async () => {
    if (diary?.id && window.confirm('Are you sure you want to delete this diary entry?')) {
      try {
        await diaryService.deleteDiary(diary.id);
        router.push('/diary');
      } catch (err) {
        console.error('Failed to delete diary:', err);
        alert('Failed to delete the diary entry. Please try again.');
      }
    }
  };

  // Find the feeling emoji if exists
  const feelingDetails = diary?.feeling 
    ? FeelingOptions.find(f => f.value === diary.feeling)
    : null;

  // Get readable formatted date
  const formattedDate = diary?.createdAt 
    ? format(new Date(diary.createdAt), 'PPpp') // e.g., "Apr 29, 2023, 3:45 PM"
    : 'Unknown date';

  // Determine text color based on background color for readability
  const getTextColor = (bgColor: string) => {
    if (!bgColor) return '#000000';
    
    // Remove # if present
    const hex = bgColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black or white based on luminance
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  // Get location label safely
  const getLocationLabel = (location: any): string => {
    if (!location) return 'Unknown';
    if (typeof location === 'string') {
      return DiaryLocationLabels[location] || location;
    }
    if (location.name) return location.name;
    return 'Unknown';
  };

  return (
    <Layout>
      <div className="container mt-4">
        <div className="mb-4">
          <Link href="/diary" className="btn btn-outline-secondary">
            ← Back to Diary List
          </Link>
        </div>
        
        {loading ? (
          <div className="d-flex justify-content-center my-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger">
            {error}
            <div className="mt-3">
              <Link href="/diary" className="btn btn-outline-primary">
                Return to Diary List
              </Link>
            </div>
          </div>
        ) : diary ? (
          <div 
            className="diary-detail-card"
            style={{ 
              backgroundColor: diary.color || '#ffffff',
              color: getTextColor(diary.color || '#ffffff')
            }}
          >
            <div className="diary-header">
              <h1>{diary.title}</h1>
              {feelingDetails && (
                <div className="feeling">
                  <span className="feeling-emoji">{feelingDetails.emoji}</span>
                  <span className="feeling-label">{feelingDetails.label}</span>
                </div>
              )}
            </div>
            
            <div className="diary-meta">
              {diary.gameLevel !== undefined && (
                <div className="meta-item">
                  <strong>Level:</strong> {diary.gameLevel}
                </div>
              )}
              <div className="meta-item">
                <strong>Where:</strong> {getLocationLabel(diary.location)}
              </div>
              <div className="meta-item">
                <strong>Created:</strong> {formattedDate}
              </div>
            </div>
            
            <div className="diary-content">
              <div dangerouslySetInnerHTML={{ __html: diary.content }} />
            </div>
            
            {diary.hasMedia && (
              <div className="media-section">
                <h3>Media</h3>
                
                {mediaUrls.audio && (
                  <div className="audio-player mb-3">
                    <h4>Audio Recording</h4>
                    <audio controls src={mediaUrls.audio} className="w-100" />
                  </div>
                )}
                
                {mediaUrls.video && (
                  <div className="video-player mb-3">
                    <h4>Video Recording</h4>
                    <video 
                      controls 
                      src={mediaUrls.video} 
                      className="w-100" 
                      style={{ maxHeight: '400px' }}
                    />
                  </div>
                )}
                
                {!mediaUrls.audio && !mediaUrls.video && diary.hasMedia && (
                  <div className="alert alert-info">
                    This diary entry has media that is {diary.isStoredLocally ? 'stored locally but could not be loaded' : 'not stored locally'}.
                  </div>
                )}
              </div>
            )}
            
            <div className="diary-actions">
              <Link href={`/diary/edit/${diary.id}`} className="btn btn-primary">
                Edit
              </Link>
              <button className="btn btn-danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="alert alert-warning">
            Diary entry not found
            <div className="mt-3">
              <Link href="/diary" className="btn btn-outline-primary">
                Return to Diary List
              </Link>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .diary-detail-card {
          border-radius: 10px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .diary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          padding-bottom: 1rem;
        }
        
        .feeling {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .feeling-emoji {
          font-size: 2.5rem;
        }
        
        .feeling-label {
          font-size: 0.9rem;
        }
        
        .diary-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .meta-item {
          padding: 0.5rem 0.75rem;
          background-color: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
        }
        
        .diary-content {
          margin-bottom: 2rem;
          font-size: 1.1rem;
          line-height: 1.6;
        }
        
        .diary-content img {
          max-width: 100%;
          height: auto;
        }
        
        .media-section {
          margin-bottom: 2rem;
          padding: 1rem;
          background-color: rgba(0, 0, 0, 0.03);
          border-radius: 6px;
        }
        
        .diary-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          padding-top: 1rem;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        @media (max-width: 768px) {
          .diary-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .feeling {
            margin-top: 1rem;
            flex-direction: row;
            gap: 0.5rem;
          }
        }
      `}</style>
    </Layout>
  );
};

export default DiaryDetailPage;