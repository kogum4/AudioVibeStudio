import { 
  validateAudioFile, 
  formatFileSize, 
  getFileExtension, 
  formatDuration, 
  isAudioFile,
  MAX_FILE_SIZE,
  MIN_FILE_SIZE 
} from '../fileValidation';

// Mock File constructor
class MockFile {
  name: string;
  size: number;
  type: string;

  constructor(name: string, size: number, type: string) {
    this.name = name;
    this.size = size;
    this.type = type;
  }
}

// Mock global File
global.File = MockFile as any;

describe('fileValidation', () => {
  describe('validateAudioFile', () => {
    it('should validate a correct audio file', () => {
      const file = new MockFile('test.mp3', 5000000, 'audio/mpeg') as any;
      const result = validateAudioFile(file);
      
      expect(result.isValid).toBe(true);
      expect(result.fileInfo).toEqual({
        name: 'test.mp3',
        size: 5000000,
        type: 'audio/mpeg'
      });
    });

    it('should reject files that are too large', () => {
      const file = new MockFile('large.mp3', MAX_FILE_SIZE + 1, 'audio/mpeg') as any;
      const result = validateAudioFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed size');
    });

    it('should reject files that are too small', () => {
      const file = new MockFile('small.mp3', MIN_FILE_SIZE - 1, 'audio/mpeg') as any;
      const result = validateAudioFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('is too small');
    });

    it('should reject unsupported file types', () => {
      const file = new MockFile('test.txt', 5000000, 'text/plain') as any;
      const result = validateAudioFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('is not supported');
    });

    it('should reject unsupported file extensions', () => {
      const file = new MockFile('test.doc', 5000000, 'audio/mpeg') as any;
      const result = validateAudioFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('extension');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    it('should handle fractional values', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(2621440)).toBe('2.5 MB');
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extensions correctly', () => {
      expect(getFileExtension('test.mp3')).toBe('mp3');
      expect(getFileExtension('audio.file.wav')).toBe('wav');
      expect(getFileExtension('noextension')).toBe('');
      expect(getFileExtension('.hidden')).toBe('');
    });
  });

  describe('formatDuration', () => {
    it('should format duration in mm:ss format', () => {
      expect(formatDuration(0)).toBe('0:00');
      expect(formatDuration(30)).toBe('0:30');
      expect(formatDuration(60)).toBe('1:00');
      expect(formatDuration(90)).toBe('1:30');
      expect(formatDuration(3661)).toBe('61:01');
    });
  });

  describe('isAudioFile', () => {
    it('should identify audio files by MIME type', () => {
      const audioFile = new MockFile('test.mp3', 5000000, 'audio/mpeg') as any;
      expect(isAudioFile(audioFile)).toBe(true);
    });

    it('should identify audio files by extension', () => {
      const audioFile = new MockFile('test.mp3', 5000000, 'application/octet-stream') as any;
      expect(isAudioFile(audioFile)).toBe(true);
    });

    it('should reject non-audio files', () => {
      const nonAudioFile = new MockFile('test.txt', 5000000, 'text/plain') as any;
      expect(isAudioFile(nonAudioFile)).toBe(false);
    });
  });
});