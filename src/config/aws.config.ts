import Constants from 'expo-constants';
import { Platform } from 'react-native';

// 웹 환경에서는 AWS SDK를 사용하지 않음
let AWS: any = null;
let transcribeService: any = null;
let rekognitionService: any = null;
let s3Service: any = null;

if (Platform.OS !== 'web') {
  try {
    AWS = require('aws-sdk');
    
    // .env 파일에서 환경 변수 가져오기
    const AWS_ACCESS_KEY_ID = Constants.expoConfig?.extra?.AWS_ACCESS_KEY_ID;
    const AWS_SECRET_ACCESS_KEY = Constants.expoConfig?.extra?.AWS_SECRET_ACCESS_KEY;
    const AWS_REGION = Constants.expoConfig?.extra?.AWS_REGION || 'ap-northeast-2';

    // AWS 설정
    AWS.config.update({
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      region: AWS_REGION,
    });

    // AWS 서비스 인스턴스들
    transcribeService = new AWS.TranscribeService();
    rekognitionService = new AWS.Rekognition();
    s3Service = new AWS.S3();
  } catch (error) {
    console.warn('AWS SDK 로드 실패:', error);
  }
} else {
  // 웹 환경용 더미 객체들
  transcribeService = {
    startTranscriptionJob: () => Promise.reject(new Error('웹 환경에서는 AWS 분석이 지원되지 않습니다')),
    getTranscriptionJob: () => Promise.reject(new Error('웹 환경에서는 AWS 분석이 지원되지 않습니다')),
  };
  
  rekognitionService = {
    startFaceDetection: () => Promise.reject(new Error('웹 환경에서는 AWS 분석이 지원되지 않습니다')),
    getFaceDetection: () => Promise.reject(new Error('웹 환경에서는 AWS 분석이 지원되지 않습니다')),
    startSegmentDetection: () => Promise.reject(new Error('웹 환경에서는 AWS 분석이 지원되지 않습니다')),
    getSegmentDetection: () => Promise.reject(new Error('웹 환경에서는 AWS 분석이 지원되지 않습니다')),
  };
  
  s3Service = {
    upload: () => Promise.reject(new Error('웹 환경에서는 AWS S3가 지원되지 않습니다')),
  };
}

// .env 파일에서 환경 변수 가져오기
const AWS_S3_BUCKET = Constants.expoConfig?.extra?.AWS_S3_BUCKET;
const AWS_S3_RECORDING_BUCKET = Constants.expoConfig?.extra?.AWS_S3_RECORDING_BUCKET;
const AWS_REGION = Constants.expoConfig?.extra?.AWS_REGION || 'ap-northeast-2';
const AWS_ACCESS_KEY_ID = Constants.expoConfig?.extra?.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = Constants.expoConfig?.extra?.AWS_SECRET_ACCESS_KEY;

// 내보내기
export { transcribeService, rekognitionService, s3Service };

// S3 버킷 설정 (.env 파일에서 가져오기)
export const BUCKETS = {
  VIDEO: AWS_S3_RECORDING_BUCKET || 'crewbe-video-uploads', // 녹화 버킷
  ANALYSIS: 'crewbe-analysis-results', // 분석 결과 저장 버킷
  PROFILE: AWS_S3_BUCKET || 'flight-attendant-profiles', // 프로필 버킷
};

// 분석 작업 관련 설정
export const ANALYSIS_CONFIG = {
  POLLING_INTERVAL: 5000, // 5초
  STT_OUTPUT_FORMAT: 'json',
  FACE_DETECTION_FEATURES: ['ALL'],
  SEGMENT_TYPES: ['TECHNICAL_CUE', 'SHOT'],
};

// 기존 AWS_CONFIG 유지 (호환성)
export const AWS_CONFIG = {
  accessKeyId: AWS_ACCESS_KEY_ID || '',
  secretAccessKey: AWS_SECRET_ACCESS_KEY || '',
  region: AWS_REGION,
  bucket: AWS_S3_BUCKET || '',
  recordingBucket: AWS_S3_RECORDING_BUCKET || '',
}; 