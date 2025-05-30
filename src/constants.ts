import Constants from 'expo-constants';

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

// .env 파일에서 S3 설정 가져오기
const AWS_S3_RECORDING_BUCKET = Constants.expoConfig?.extra?.AWS_S3_RECORDING_BUCKET;
const AWS_REGION = Constants.expoConfig?.extra?.AWS_REGION || 'ap-northeast-2';

// S3 업로드 설정
export const S3_CONFIG = {
  BUCKET: AWS_S3_RECORDING_BUCKET || 'crewbe-video-uploads',
  REGION: AWS_REGION,
};

// S3 키 생성 함수
export const generateS3Key = (): string => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  return `videos/interview-${timestamp}-${randomId}.webm`;
};

// AWS S3 Pre-Signed PUT URL (임시 하드코딩 - 실제로는 서버에서 생성해야 함)
export const PRESIGNED_PUT_URL = `https://${S3_CONFIG.BUCKET}.s3.${S3_CONFIG.REGION}.amazonaws.com/videos/test-video.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...`;

// MediaRecorder 설정
export const RECORDER_CONFIG = {
  mimeType: 'video/webm;codecs=vp8,opus',
  videoBitsPerSecond: 1000000, // 1Mbps
  audioBitsPerSecond: 128000,  // 128kbps
}; 