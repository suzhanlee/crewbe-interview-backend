const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');

// 새로운 로깅 시스템 임포트
const { logger, apiLogger } = require('../utils/logger');

// AWS 설정
const s3 = new AWS.S3();

const router = express.Router();

// 메모리 스토리지 설정 (파일을 메모리에 임시 저장)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB 제한
  }
});

// Pre-Signed URL 생성 엔드포인트
router.post('/presigned-url', async (req, res) => {
  const startTime = Date.now();
  try {
    const { fileName, fileType } = req.body;
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const s3Key = `videos/interview-${timestamp}-${randomId}.webm`;
    
    logger.info('🔗 Pre-Signed URL 생성 요청', {
      requestId: req.requestId,
      fileName,
      fileType,
      s3Key
    });
    
    const bucketName = process.env.AWS_S3_RECORDING_BUCKET || 'flight-attendant-recordings';
    
    const params = {
      Bucket: bucketName,
      Key: s3Key,
      ContentType: fileType || 'video/webm',
      Expires: 3600, // 1시간 유효
    };

    // AWS 호출 시작 로깅
    apiLogger.aws.start('S3', 'getSignedUrlPromise', params, req.requestId);
    
    const awsStartTime = Date.now();
    const presignedUrl = await s3.getSignedUrlPromise('putObject', params);
    const awsDuration = Date.now() - awsStartTime;
    
    // AWS 호출 성공 로깅
    apiLogger.aws.success('S3', 'getSignedUrlPromise', {
      urlLength: presignedUrl.length,
      bucket: bucketName
    }, req.requestId, awsDuration);
    
    const responseData = {
      success: true,
      presignedUrl: presignedUrl,
      s3Key: s3Key,
      bucket: bucketName,
      expiresIn: 3600,
      timestamp: new Date().toISOString()
    };
    
    logger.info('✅ Pre-Signed URL 생성 성공', {
      requestId: req.requestId,
      s3Key,
      bucket: bucketName,
      urlLength: presignedUrl.length,
      totalDuration: `${Date.now() - startTime}ms`
    });
    
    res.json(responseData);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    apiLogger.aws.error('S3', 'getSignedUrlPromise', error, req.requestId, duration);
    
    res.status(500).json({
      success: false,
      error: 'Pre-Signed URL 생성 실패',
      message: error.message,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }
});

// 직접 업로드 엔드포인트 (멀티파트 파일 업로드)
router.post('/direct', upload.single('video'), async (req, res) => {
  const startTime = Date.now();
  try {
    if (!req.file) {
      logger.warn('📤 직접 업로드 실패 - 파일 없음', {
        requestId: req.requestId
      });
      
      return res.status(400).json({
        success: false,
        error: '파일이 제공되지 않았습니다',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const s3Key = `videos/interview-${timestamp}-${randomId}.webm`;
    const bucketName = process.env.AWS_S3_RECORDING_BUCKET || 'flight-attendant-recordings';
    
    // 업로드 시작 로깅
    apiLogger.upload.start(req.file.originalname, req.file.size, req.requestId);

    const uploadParams = {
      Bucket: bucketName,
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    // AWS 업로드 시작 로깅
    apiLogger.aws.start('S3', 'upload', {
      bucket: bucketName,
      key: s3Key,
      contentType: req.file.mimetype,
      size: req.file.size
    }, req.requestId);

    const awsStartTime = Date.now();
    const result = await s3.upload(uploadParams).promise();
    const awsDuration = Date.now() - awsStartTime;
    const totalDuration = Date.now() - startTime;
    
    const fileSizeMB = (req.file.size / 1024 / 1024).toFixed(2);
    const uploadSpeed = (fileSizeMB * 8 / (awsDuration / 1000)).toFixed(2);

    // AWS 업로드 성공 로깅
    apiLogger.aws.success('S3', 'upload', {
      location: result.Location,
      uploadSpeed: `${uploadSpeed}Mbps`
    }, req.requestId, awsDuration);
    
    // 업로드 성공 로깅
    apiLogger.upload.success(
      req.file.originalname, 
      s3Key, 
      (awsDuration / 1000).toFixed(2), 
      uploadSpeed, 
      req.requestId
    );

    res.json({
      success: true,
      s3Url: result.Location,
      s3Key: s3Key,
      bucket: bucketName,
      fileSize: req.file.size,
      uploadTime: parseFloat((awsDuration / 1000).toFixed(2)),
      uploadSpeed: parseFloat(uploadSpeed),
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    // 업로드 에러 로깅
    apiLogger.upload.error(req.file?.originalname || 'unknown', error, req.requestId);
    apiLogger.aws.error('S3', 'upload', error, req.requestId, duration);
    
    res.status(500).json({
      success: false,
      error: '파일 업로드 실패',
      message: error.message,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }
});

// 업로드 상태 확인 엔드포인트
router.get('/status/:s3Key', async (req, res) => {
  const startTime = Date.now();
  try {
    const { s3Key } = req.params;
    const bucketName = process.env.AWS_S3_RECORDING_BUCKET || 'flight-attendant-recordings';
    
    logger.info('🔍 파일 상태 확인 요청', {
      requestId: req.requestId,
      s3Key,
      bucket: bucketName
    });

    const params = {
      Bucket: bucketName,
      Key: s3Key
    };

    // AWS 호출 시작 로깅
    apiLogger.aws.start('S3', 'headObject', params, req.requestId);
    
    const awsStartTime = Date.now();
    const headResult = await s3.headObject(params).promise();
    const awsDuration = Date.now() - awsStartTime;
    
    // AWS 호출 성공 로깅
    apiLogger.aws.success('S3', 'headObject', {
      contentLength: headResult.ContentLength,
      lastModified: headResult.LastModified,
      contentType: headResult.ContentType
    }, req.requestId, awsDuration);

    logger.info('✅ 파일 존재 확인 완료', {
      requestId: req.requestId,
      s3Key,
      fileSize: headResult.ContentLength,
      lastModified: headResult.LastModified,
      totalDuration: `${Date.now() - startTime}ms`
    });

    res.json({
      success: true,
      exists: true,
      fileSize: headResult.ContentLength,
      lastModified: headResult.LastModified,
      contentType: headResult.ContentType,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error.code === 'NotFound') {
      logger.warn('⚠️ 파일을 찾을 수 없음', {
        requestId: req.requestId,
        s3Key: req.params.s3Key
      });
      
      res.json({
        success: true,
        exists: false,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } else {
      apiLogger.aws.error('S3', 'headObject', error, req.requestId, duration);
      
      res.status(500).json({
        success: false,
        error: '파일 상태 확인 실패',
        message: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }
});

module.exports = router; 