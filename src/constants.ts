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

// AWS S3 Pre-Signed PUT URL (임시 하드코딩) - 실제로는 백엔드에서 동적 생성 필요
export const PRESIGNED_PUT_URL = "https://flight-attendant-recordings.s3.ap-northeast-2.amazonaws.com/videos/interview-{timestamp}.webm?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...";

// S3 버킷 정보
export const S3_BUCKETS = {
  PROFILES: 'flight-attendant-profiles',      // 프로필 사진/비디오
  RECORDINGS: 'flight-attendant-recordings'   // 면접 녹화 파일
};

// MediaRecorder 설정
export const RECORDER_CONFIG = {
  mimeType: 'video/webm;codecs=vp8,opus',
  videoBitsPerSecond: 1000000, // 1Mbps
  audioBitsPerSecond: 128000,  // 128kbps
}; 