import AWS from 'aws-sdk';
import { AWS_CONFIG } from '../config/aws.config';
import { UploadResult } from '../types/profile';

// AWS S3 설정
AWS.config.update({
  accessKeyId: AWS_CONFIG.accessKeyId,
  secretAccessKey: AWS_CONFIG.secretAccessKey,
  region: AWS_CONFIG.region,
});

const s3 = new AWS.S3();

export const uploadToS3 = async (
  uri: string,
  fileName: string,
  fileType: string
): Promise<UploadResult> => {
  try {
    if (!AWS_CONFIG.accessKeyId || !AWS_CONFIG.secretAccessKey) {
      throw new Error('AWS 자격 증명이 설정되지 않았습니다. 환경변수를 확인해주세요.');
    }

    // 파일 데이터 준비
    const response = await fetch(uri);
    const blob = await response.blob();
    
    const uploadParams = {
      Bucket: AWS_CONFIG.bucket,
      Key: `profiles/${Date.now()}_${fileName}`,
      Body: blob,
      ContentType: fileType,
      ACL: 'public-read' as const,
    };

    const result = await s3.upload(uploadParams).promise();

    return {
      success: true,
      url: result.Location,
    };
  } catch (error) {
    console.error('S3 업로드 에러:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '업로드에 실패했습니다.',
    };
  }
}; 