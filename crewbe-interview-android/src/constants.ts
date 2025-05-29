export const COLORS = {
  primary: '#007AFF',
  secondary: '#5AC8FA', 
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  text: '#000000',
  background: '#F2F2F7',
  gray: '#8E8E93',
  lightGray: '#C7C7CC',
  white: '#FFFFFF',
};

// AWS S3 Pre-Signed PUT URL (임시 하드코딩)
export const PRESIGNED_PUT_URL = "https://your-bucket.s3.ap-northeast-2.amazonaws.com/videos/test-video.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...";

// MediaRecorder 설정
export const RECORDER_CONFIG = {
  mimeType: 'video/webm;codecs=vp8,opus',
  videoBitsPerSecond: 1000000, // 1Mbps
  audioBitsPerSecond: 128000,  // 128kbps
}; 