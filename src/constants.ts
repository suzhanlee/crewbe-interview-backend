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

// .env 파일에서 AWS 설정 가져오기 (환경변수와 일치)
const AWS_S3_RECORDING_BUCKET = Constants.expoConfig?.extra?.AWS_S3_RECORDING_BUCKET;
const AWS_S3_BUCKET = Constants.expoConfig?.extra?.AWS_S3_BUCKET;
const AWS_REGION = Constants.expoConfig?.extra?.AWS_REGION || 'ap-northeast-2';
const AWS_ACCESS_KEY_ID = Constants.expoConfig?.extra?.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = Constants.expoConfig?.extra?.AWS_SECRET_ACCESS_KEY;

// 환경변수 로딩 상태 로깅
console.log('🔧 [CONSTANTS] 환경변수 로딩 상태:');
console.log('🔧 [CONSTANTS]   - AWS_S3_RECORDING_BUCKET:', AWS_S3_RECORDING_BUCKET || '없음');
console.log('🔧 [CONSTANTS]   - AWS_S3_BUCKET:', AWS_S3_BUCKET || '없음');
console.log('🔧 [CONSTANTS]   - AWS_REGION:', AWS_REGION);
console.log('🔧 [CONSTANTS]   - AWS_ACCESS_KEY_ID:', AWS_ACCESS_KEY_ID ? '설정됨' : '없음');
console.log('🔧 [CONSTANTS]   - AWS_SECRET_ACCESS_KEY:', AWS_SECRET_ACCESS_KEY ? '설정됨' : '없음');

// S3 업로드 설정 (환경변수 우선 사용)
export const S3_CONFIG = {
  BUCKET: AWS_S3_RECORDING_BUCKET || 'flight-attendant-recordings', // 기본값을 환경변수와 일치
  REGION: AWS_REGION,
};

console.log('🔧 [CONSTANTS] 최종 S3 설정:');
console.log('🔧 [CONSTANTS]   - BUCKET:', S3_CONFIG.BUCKET);
console.log('🔧 [CONSTANTS]   - REGION:', S3_CONFIG.REGION);

// S3 키 생성 함수
export const generateS3Key = (): string => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  return `videos/interview-${timestamp}-${randomId}.webm`;
};

// MediaRecorder 설정
export const RECORDER_CONFIG = {
  mimeType: 'video/webm;codecs=vp8,opus',
  videoBitsPerSecond: 1000000, // 1Mbps
  audioBitsPerSecond: 128000,  // 128kbps
}; 