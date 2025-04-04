import React, { useState, useRef, useEffect } from 'react';
import { encrypt } from '../../utils/encryption';

interface MediaRecorderProps {
  onMediaCaptured: (blob: Blob, type: 'audio' | 'video', encryptedData?: ArrayBuffer) => void;
}

const MediaRecorderComponent: React.FC<MediaRecorderProps> = ({ onMediaCaptured }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingType, setRecordingType] = useState<'audio' | 'video' | null>(null);
  const [permission, setPermission] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chunksRef = useRef<Blob[]>([]);

  const requestPermission = async (type: 'audio' | 'video') => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: type === 'video',
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setPermission(true);
      
      if (type === 'video' && videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing media devices:', err);
      alert('Cannot access your camera or microphone. Please check permissions.');
    }
  };

  const startRecording = (type: 'audio' | 'video') => {
    if (!stream) return;
    
    chunksRef.current = [];
    setRecordingType(type);
    
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };
    
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { 
        type: type === 'video' ? 'video/webm' : 'audio/webm' 
      });
      
      // Generate a random encryption key
      const encryptionKey = crypto.getRandomValues(new Uint8Array(32));
      
      try {
        // Encrypt the media data
        const arrayBuffer = await blob.arrayBuffer();
        const encryptedData = await encrypt(arrayBuffer, encryptionKey);
        
        // Pass both the original blob (for preview) and encrypted data
        onMediaCaptured(blob, type, encryptedData);
      } catch (error) {
        console.error('Error encrypting media:', error);
        // If encryption fails, at least provide the unencrypted blob
        onMediaCaptured(blob, type);
      }
      
      setIsRecording(false);
      setRecordingType(null);
    };
    
    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup function to stop all tracks when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="media-recorder">
      {recordingType === 'video' && (
        <div className="video-preview">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            style={{ width: '100%', maxHeight: '300px', backgroundColor: '#000' }}
          />
        </div>
      )}

      <div className="recording-controls">
        {!permission ? (
          <>
            <button 
              className="btn btn-primary me-2" 
              onClick={() => requestPermission('audio')}
            >
              Allow Audio Recording
            </button>
            <button 
              className="btn btn-primary" 
              onClick={() => requestPermission('video')}
            >
              Allow Video Recording
            </button>
          </>
        ) : !isRecording ? (
          <>
            <button 
              className="btn btn-danger me-2" 
              onClick={() => startRecording('audio')}
            >
              Record Audio
            </button>
            <button 
              className="btn btn-danger" 
              onClick={() => startRecording('video')}
            >
              Record Video
            </button>
          </>
        ) : (
          <button 
            className="btn btn-warning" 
            onClick={stopRecording}
          >
            Stop Recording
          </button>
        )}
      </div>
      
      {isRecording && (
        <div className="recording-indicator">
          <span className="badge bg-danger">Recording {recordingType}...</span>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{
        __html: `
        .media-recorder {
          margin-bottom: 20px;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .recording-controls {
          display: flex;
          margin-top: 10px;
        }
        .recording-indicator {
          margin-top: 10px;
          display: flex;
          align-items: center;
        }
        .recording-indicator .badge {
          display: flex;
          align-items: center;
        }
        .recording-indicator .badge:before {
          content: "";
          width: 10px;
          height: 10px;
          background-color: red;
          border-radius: 50%;
          display: inline-block;
          margin-right: 5px;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
          100% {
            opacity: 1;
          }
        }
      `}} />
    </div>
  );
};

export default MediaRecorderComponent;