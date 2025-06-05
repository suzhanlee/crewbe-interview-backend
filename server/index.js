const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const AWS = require('aws-sdk');

// 새로운 로깅 시스템 임포트
const { logger, apiLogger, systemLogger } = require('./utils/logger');

// 환경 변수 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 새로운 API 로깅 미들웨어 적용
app.use(apiLogger.request);

// AWS SDK 설정
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-northeast-2'
});

const s3 = new AWS.S3();
const transcribe = new AWS.TranscribeService();
const rekognition = new AWS.Rekognition();

// AWS SDK 초기화 로깅 개선
logger.info('🔧 AWS SDK 초기화 완료', {
  region: process.env.AWS_REGION || 'ap-northeast-2',
  accessKeyConfigured: !!process.env.AWS_ACCESS_KEY_ID,
  secretKeyConfigured: !!process.env.AWS_SECRET_ACCESS_KEY,
  services: ['S3', 'Transcribe', 'Rekognition']
});

// 라우트 연결
const uploadRoutes = require('./routes/upload');
const analysisRoutes = require('./routes/analysis');

app.use('/api/upload', uploadRoutes);
app.use('/api/analysis', analysisRoutes);

// 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
  const healthData = { 
    status: 'OK', 
    message: 'Flight Attendant Interview API Server is running',
    timestamp: new Date().toISOString(),
    environment: {
      aws_region: process.env.AWS_REGION || 'ap-northeast-2',
      aws_configured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
      buckets: {
        video: process.env.AWS_S3_RECORDING_BUCKET || 'flight-attendant-recordings',
        analysis: 'crewbe-analysis-results',
        profile: process.env.AWS_S3_BUCKET || 'flight-attendant-profiles'
      }
    }
  };
  
  logger.info('💊 Health Check Requested', {
    requestId: req.requestId,
    status: healthData.status,
    awsConfigured: healthData.environment.aws_configured
  });
  
  res.json(healthData);
});

// 에러 핸들링 미들웨어
app.use((error, req, res, next) => {
  logger.error('💥 Server Error', {
    requestId: req.requestId,
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method
  });
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

// 404 핸들러
app.use('*', (req, res) => {
  logger.warn('🔍 Route Not Found', {
    requestId: req.requestId,
    url: req.originalUrl,
    method: req.method,
    userAgent: req.get('User-Agent')
  });
  
  res.status(404).json({
    error: 'Not Found',
    message: `경로 ${req.originalUrl}를 찾을 수 없습니다`,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

// 서버 시작
app.listen(PORT, () => {
  // 시스템 시작 로깅
  systemLogger.startup();
  
  logger.info('🚀 Express.js 서버 시작 완료!', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: `http://localhost:${PORT}/health`,
      upload: `http://localhost:${PORT}/api/upload`,
      analysis: `http://localhost:${PORT}/api/analysis`
    }
  });
  
  // 메모리 사용량 주기적 로깅 (5분마다)
  setInterval(() => {
    systemLogger.memoryUsage();
  }, 5 * 60 * 1000);
});

// AWS 서비스들을 전역에서 사용할 수 있도록 export
module.exports = { s3, transcribe, rekognition }; 