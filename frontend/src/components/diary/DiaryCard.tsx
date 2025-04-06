import React from 'react';
import { Diary, DiaryLocationLabels, FeelingOptions } from '../../types/diary';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface DiaryCardProps {
  diary: Diary;
  onDelete?: (id: string) => void;
}

const DiaryCard: React.FC<DiaryCardProps> = ({ diary, onDelete }) => {
  // Find the feeling emoji if exists
  const feelingEmoji = diary.feeling 
    ? FeelingOptions.find(f => f.value === diary.feeling)?.emoji 
    : null;

  // Format the date
  const formattedDate = diary.createdAt 
    ? formatDistanceToNow(new Date(diary.createdAt), { addSuffix: true })
    : 'Unknown date';

  // Extract a preview of the content by removing HTML tags
  const contentPreview = diary.content
    ? diary.content
        .replace(/<[^>]*>/g, ' ')
        .slice(0, 120) + (diary.content.length > 120 ? '...' : '')
    : '';

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

  const cardBgColor = diary.color || '#ffffff';
  const textColor = getTextColor(cardBgColor);

  return (
    <div 
      className="diary-card" 
      style={{ 
        backgroundColor: cardBgColor,
        color: textColor
      }}
    >
      <div className="diary-header">
        <h3 className="diary-title">{diary.title}</h3>
        {feelingEmoji && <div className="diary-feeling">{feelingEmoji}</div>}
      </div>
      
      <div className="diary-meta">
        <span className="diary-level">Level {diary.gameLevel}</span>
        <span className="diary-location">
          {DiaryLocationLabels[diary.location]}
        </span>
        <span className="diary-date">{formattedDate}</span>
      </div>
      
      <div className="diary-preview">{contentPreview}</div>
      
      <div className="diary-media-indicator">
        {diary.hasMedia && (
          <div className="has-media">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2V5z"/>
            </svg>
            <span>Media attached</span>
          </div>
        )}
      </div>
      
      <div className="diary-actions" style={{ color: textColor }}>
        <Link 
          href={`/diary/${diary.id}`}
          className="diary-action-btn view-btn"
          style={{ color: textColor }}
        >
          View
        </Link>
        <Link 
          href={`/diary/edit/${diary.id}`}
          className="diary-action-btn edit-btn"
          style={{ color: textColor }}
        >
          Edit
        </Link>
        {onDelete && (
          <button 
            className="diary-action-btn delete-btn"
            onClick={() => diary.id && onDelete(diary.id)}
            style={{ color: textColor }}
          >
            Delete
          </button>
        )}
      </div>
      
      <style>{`
        .diary-card {
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          position: relative;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .diary-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        
        .diary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .diary-title {
          margin: 0;
          font-size: 1.25rem;
        }
        
        .diary-feeling {
          font-size: 1.5rem;
        }
        
        .diary-meta {
          display: flex;
          font-size: 0.8rem;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }
        
        .diary-meta > span {
          margin-right: 15px;
          display: flex;
          align-items: center;
        }
        
        .diary-meta > span:last-child {
          margin-left: auto;
          margin-right: 0;
        }
        
        .diary-level::before {
          content: "🎮";
          margin-right: 5px;
        }
        
        .diary-location::before {
          content: "📍";
          margin-right: 5px;
        }
        
        .diary-date::before {
          content: "🕒";
          margin-right: 5px;
        }
        
        .diary-preview {
          margin-bottom: 15px;
          font-size: 0.9rem;
          line-height: 1.4;
        }
        
        .diary-media-indicator {
          margin-bottom: 10px;
          font-size: 0.85rem;
        }
        
        .has-media {
          display: flex;
          align-items: center;
        }
        
        .has-media svg {
          margin-right: 5px;
        }
        
        .diary-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 10px;
        }
        
        .diary-action-btn {
          background: none;
          border: 1px solid currentColor;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          transition: background-color 0.2s, opacity 0.2s;
        }
        
        .diary-action-btn:hover {
          opacity: 0.8;
          text-decoration: none;
        }
        
        .delete-btn {
          background: none;
        }
      `}</style>
    </div>
  );
};

export default DiaryCard;