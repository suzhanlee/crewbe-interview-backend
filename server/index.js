const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const AWS = require('aws-sdk');

// 환경 변수 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`🌐 [SERVER] [${timestamp}] ${req.method} ${req.path}`);
  next();
});

// AWS SDK 설정
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-northeast-2'
});

const s3 = new AWS.S3();
const transcribe = new AWS.TranscribeService();
const rekognition = new AWS.Rekognition();

console.log('🔧 [AWS-SERVER] AWS SDK 초기화 완료');
console.log('🔧 [AWS-SERVER] 설정된 리전:', process.env.AWS_REGION || 'ap-northeast-2');
console.log('🔧 [AWS-SERVER] ACCESS_KEY:', process.env.AWS_ACCESS_KEY_ID ? '설정됨' : '없음');
console.log('🔧 [AWS-SERVER] SECRET_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '설정됨' : '없음');

// 라우트 연결
const uploadRoutes = require('./routes/upload');
const analysisRoutes = require('./routes/analysis');

app.use('/api/upload', uploadRoutes);
app.use('/api/analysis', analysisRoutes);

// 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ 
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
  });
});

// 에러 핸들링 미들웨어
app.use((error, req, res, next) => {
  console.error('💥 [SERVER-ERROR]', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `경로 ${req.originalUrl}를 찾을 수 없습니다`,
    timestamp: new Date().toISOString()
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log('🚀 [SERVER] =============================');
  console.log('🚀 [SERVER] Express.js 서버 시작 완료!');
  console.log('🚀 [SERVER] =============================');
  console.log(`📍 [SERVER] 서버 주소: http://localhost:${PORT}`);
  console.log(`🔗 [SERVER] 헬스 체크: http://localhost:${PORT}/health`);
  console.log(`📁 [SERVER] 업로드 API: http://localhost:${PORT}/api/upload`);
  console.log(`🧠 [SERVER] 분석 API: http://localhost:${PORT}/api/analysis`);
  console.log('🚀 [SERVER] =============================');
});

// AWS 서비스들을 전역에서 사용할 수 있도록 export
module.exports = { s3, transcribe, rekognition }; 