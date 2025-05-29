import Constants from 'expo-constants';

export const AWS_CONFIG = {
  accessKeyId: Constants.expoConfig?.extra?.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: Constants.expoConfig?.extra?.AWS_SECRET_ACCESS_KEY || '',
  region: Constants.expoConfig?.extra?.AWS_REGION || 'ap-northeast-2',
  bucket: Constants.expoConfig?.extra?.AWS_S3_BUCKET || '',
  recordingBucket: Constants.expoConfig?.extra?.AWS_S3_RECORDING_BUCKET || ''
}; 