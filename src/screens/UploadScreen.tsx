import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AudioContextManager } from '../modules/audio/AudioContext';

export function UploadScreen() {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    if (file.type.startsWith('audio/')) {
      try {
        const audioManager = AudioContextManager.getInstance();
        await audioManager.loadAudioFile(file);
        navigate('/editor');
      } catch (error) {
        console.error('Error loading audio file:', error);
        alert('Failed to load audio file. Please try another file.');
      }
    } else {
      alert('Please select an audio file');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="upload-screen">
      <div className="upload-container">
        <h1>AudioVibe Studio</h1>
        <p className="subtitle">Create stunning audio-reactive videos</p>
        
        <div
          className={`upload-area ${isDragging ? 'dragging' : ''}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-icon">🎵</div>
          <p className="upload-text">
            {isDragging ? 'Drop your audio file here' : 'Drag & drop audio file or click to browse'}
          </p>
          <p className="upload-hint">Supported formats: MP3, WAV, OGG, M4A</p>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}