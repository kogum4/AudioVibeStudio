export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    duration?: number;
  };
}

export const SUPPORTED_AUDIO_FORMATS = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/m4a',
  'audio/aac',
  'audio/flac'
];

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const MIN_FILE_SIZE = 1024; // 1KB

export function validateAudioFile(file: File): FileValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(MAX_FILE_SIZE)})`
    };
  }

  if (file.size < MIN_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size (${formatFileSize(file.size)}) is too small. Minimum size is ${formatFileSize(MIN_FILE_SIZE)}`
    };
  }

  // Check file type
  if (!SUPPORTED_AUDIO_FORMATS.includes(file.type)) {
    return {
      isValid: false,
      error: `File type "${file.type}" is not supported. Supported formats: ${SUPPORTED_AUDIO_FORMATS.join(', ')}`
    };
  }

  // Check file extension
  const fileExtension = getFileExtension(file.name);
  const supportedExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
  
  if (!supportedExtensions.includes(fileExtension.toLowerCase())) {
    return {
      isValid: false,
      error: `File extension "${fileExtension}" is not supported. Supported extensions: ${supportedExtensions.join(', ')}`
    };
  }

  return {
    isValid: true,
    fileInfo: {
      name: file.name,
      size: file.size,
      type: file.type
    }
  };
}

export function validateFileForUpload(file: File): Promise<FileValidationResult> {
  return new Promise((resolve) => {
    const basicValidation = validateAudioFile(file);
    
    if (!basicValidation.isValid) {
      resolve(basicValidation);
      return;
    }

    // Additional async validation - check if file can be loaded as audio
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      
      if (audio.duration === Infinity || isNaN(audio.duration)) {
        resolve({
          isValid: false,
          error: 'Audio file appears to be corrupted or has invalid duration'
        });
      } else {
        resolve({
          isValid: true,
          fileInfo: {
            name: file.name,
            size: file.size,
            type: file.type,
            duration: audio.duration
          }
        });
      }
    });

    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      resolve({
        isValid: false,
        error: 'Audio file is corrupted or in an unsupported format'
      });
    });

    // Set timeout for validation
    setTimeout(() => {
      URL.revokeObjectURL(url);
      resolve({
        isValid: false,
        error: 'File validation timed out'
      });
    }, 5000);

    audio.src = url;
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function isAudioFile(file: File): boolean {
  return SUPPORTED_AUDIO_FORMATS.includes(file.type) ||
         ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(getFileExtension(file.name).toLowerCase());
}