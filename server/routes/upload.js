const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');

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
  try {
    const { fileName, fileType } = req.body;
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const s3Key = `videos/interview-${timestamp}-${randomId}.webm`;
    
    console.log('🔗 [UPLOAD] Pre-Signed URL 생성 요청');
    console.log('🔗 [UPLOAD]   - 파일명:', fileName);
    console.log('🔗 [UPLOAD]   - 파일타입:', fileType);
    console.log('🔗 [UPLOAD]   - S3 키:', s3Key);
    
    const bucketName = process.env.AWS_S3_RECORDING_BUCKET || 'flight-attendant-recordings';
    
    const params = {
      Bucket: bucketName,
      Key: s3Key,
      ContentType: fileType || 'video/webm',
      Expires: 3600, // 1시간 유효
    };

    const presignedUrl = await s3.getSignedUrlPromise('putObject', params);
    
    console.log('✅ [UPLOAD] Pre-Signed URL 생성 성공');
    console.log('✅ [UPLOAD]   - URL 길이:', presignedUrl.length);
    console.log('✅ [UPLOAD]   - 버킷:', bucketName);
    
    res.json({
      success: true,
      presignedUrl: presignedUrl,
      s3Key: s3Key,
      bucket: bucketName,
      expiresIn: 3600,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('💥 [UPLOAD] Pre-Signed URL 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: 'Pre-Signed URL 생성 실패',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 직접 업로드 엔드포인트 (멀티파트 파일 업로드)
router.post('/direct', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '파일이 제공되지 않았습니다',
        timestamp: new Date().toISOString()
      });
    }

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const s3Key = `videos/interview-${timestamp}-${randomId}.webm`;
    const bucketName = process.env.AWS_S3_RECORDING_BUCKET || 'flight-attendant-recordings';
    
    console.log('📤 [UPLOAD] 직접 업로드 시작');
    console.log('📤 [UPLOAD]   - 파일 크기:', (req.file.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('📤 [UPLOAD]   - 파일 타입:', req.file.mimetype);
    console.log('📤 [UPLOAD]   - S3 키:', s3Key);
    console.log('📤 [UPLOAD]   - 버킷:', bucketName);

    const uploadParams = {
      Bucket: bucketName,
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    const startTime = Date.now();
    const result = await s3.upload(uploadParams).promise();
    const endTime = Date.now();
    const uploadTime = ((endTime - startTime) / 1000).toFixed(2);
    const fileSizeMB = (req.file.size / 1024 / 1024).toFixed(2);
    const uploadSpeed = (fileSizeMB * 8 / parseFloat(uploadTime)).toFixed(2);

    console.log('✅ [UPLOAD] 직접 업로드 성공');
    console.log('✅ [UPLOAD]   - 업로드 시간:', uploadTime, '초');
    console.log('✅ [UPLOAD]   - 업로드 속도:', uploadSpeed, 'Mbps');
    console.log('✅ [UPLOAD]   - S3 URL:', result.Location);

    res.json({
      success: true,
      s3Url: result.Location,
      s3Key: s3Key,
      bucket: bucketName,
      fileSize: req.file.size,
      uploadTime: parseFloat(uploadTime),
      uploadSpeed: parseFloat(uploadSpeed),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 [UPLOAD] 직접 업로드 실패:', error);
    res.status(500).json({
      success: false,
      error: '파일 업로드 실패',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 업로드 상태 확인 엔드포인트
router.get('/status/:s3Key', async (req, res) => {
  try {
    const { s3Key } = req.params;
    const bucketName = process.env.AWS_S3_RECORDING_BUCKET || 'flight-attendant-recordings';
    
    console.log('🔍 [UPLOAD] 파일 상태 확인:', s3Key);

    const params = {
      Bucket: bucketName,
      Key: s3Key
    };

    const headResult = await s3.headObject(params).promise();
    
    console.log('✅ [UPLOAD] 파일 존재 확인 완료');
    console.log('✅ [UPLOAD]   - 파일 크기:', headResult.ContentLength, 'bytes');
    console.log('✅ [UPLOAD]   - 마지막 수정:', headResult.LastModified);

    res.json({
      success: true,
      exists: true,
      fileSize: headResult.ContentLength,
      lastModified: headResult.LastModified,
      contentType: headResult.ContentType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (error.code === 'NotFound') {
      console.log('⚠️ [UPLOAD] 파일을 찾을 수 없음:', req.params.s3Key);
      res.json({
        success: true,
        exists: false,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('💥 [UPLOAD] 파일 상태 확인 실패:', error);
      res.status(500).json({
        success: false,
        error: '파일 상태 확인 실패',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
});

module.exports = router; 