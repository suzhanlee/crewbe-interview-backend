# Didim Interview Analysis Server

승무원 면접 분석을 위한 백엔드 API 서버입니다. AWS 서비스를 활용하여 영상 업로드, 음성 전사(STT), 얼굴 감지, 감정 분석 등의 기능을 제공합니다.

## 주요 기능

### 🎥 영상 업로드
- **Pre-Signed URL 생성**: 클라이언트에서 직접 S3에 업로드할 수 있는 안전한 URL 제공
- **직접 업로드**: 서버를 통한 멀티파트 파일 업로드 지원
- **업로드 상태 확인**: S3에 저장된 파일의 존재 여부 및 메타데이터 확인

### 🧠 AI 분석 서비스
- **음성 전사 (STT)**: AWS Transcribe를 사용한 한국어 음성-텍스트 변환
- **얼굴 감지**: AWS Rekognition을 사용한 실시간 얼굴 감지 및 표정 분석
- **감정 분석**: 영상 내 감정 변화 및 세그먼트 분석
- **분석 상태 추적**: 각 분석 작업의 진행 상황 실시간 모니터링

## 기술 스택

- **런타임**: Node.js 16+
- **웹 프레임워크**: Express.js
- **클라우드 서비스**: AWS (S3, Transcribe, Rekognition)
- **파일 업로드**: Multer
- **환경 변수 관리**: dotenv
- **고유 ID 생성**: uuid

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# AWS 설정
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=ap-northeast-2

# S3 버킷 설정
AWS_S3_RECORDING_BUCKET=flight-attendant-recordings
AWS_S3_BUCKET=flight-attendant-profiles

# 서버 설정
PORT=3000
```

### 3. 서버 실행

#### 프로덕션 모드
```bash
npm start
```

#### 개발 모드 (nodemon 사용)
```bash
npm run dev
```

### 4. 서버 상태 확인
브라우저에서 `http://localhost:3000/health`로 접속하여 서버 상태를 확인할 수 있습니다.

## API 엔드포인트

### 헬스 체크
```
GET /health
```
서버 상태 및 AWS 설정 정보를 반환합니다.

### 업로드 API

#### Pre-Signed URL 생성
```
POST /api/upload/presigned-url
Content-Type: application/json

{
  "fileName": "interview.webm",
  "fileType": "video/webm"
}
```

#### 직접 파일 업로드
```
POST /api/upload/direct
Content-Type: multipart/form-data

Form Data:
- video: 업로드할 영상 파일 (최대 100MB)
```

#### 업로드 상태 확인
```
GET /api/upload/status/:s3Key
```

### 분석 API

#### 면접 분석 시작
```
POST /api/analysis/start
Content-Type: application/json

{
  "s3Key": "videos/interview-1234567890-abc123.webm",
  "bucket": "flight-attendant-recordings"
}
```

#### 분석 상태 확인
```
GET /api/analysis/status/:jobType/:jobId

jobType: stt | face | segment
jobId: AWS에서 반환된 작업 ID
```

## 디렉토리 구조

```
├── server/                 # 백엔드 서버 코드
│   ├── index.js           # Express 서버 메인 파일
│   └── routes/            # API 라우트
│       ├── upload.js      # 파일 업로드 관련 API
│       └── analysis.js    # 분석 관련 API
├── docs/                  # 문서 파일
├── package.json           # 프로젝트 의존성
├── .env                   # 환경 변수 (직접 생성 필요)
└── README.md             # 이 파일
```

## AWS 서비스 설정

### 필요한 AWS 서비스
1. **S3**: 영상 파일 저장
2. **Transcribe**: 음성-텍스트 변환
3. **Rekognition**: 얼굴 감지 및 감정 분석

### 권한 설정
AWS IAM 사용자에게 다음 권한이 필요합니다:
- S3: `s3:GetObject`, `s3:PutObject`, `s3:HeadObject`
- Transcribe: `transcribe:StartTranscriptionJob`, `transcribe:GetTranscriptionJob`
- Rekognition: `rekognition:StartFaceDetection`, `rekognition:GetFaceDetection`, `rekognition:StartSegmentDetection`, `rekognition:GetSegmentDetection`

## 로그 및 모니터링

서버는 다음과 같은 로그를 제공합니다:
- 🌐 **HTTP 요청 로그**: 모든 API 호출 기록
- 📤 **업로드 로그**: 파일 업로드 진행 상황
- 🧠 **분석 로그**: AI 분석 작업 상태
- 💥 **에러 로그**: 오류 발생 시 상세 정보

## 개발 참고사항

- 파일 업로드 크기 제한: 100MB
- Pre-Signed URL 유효 시간: 1시간
- 지원 영상 포맷: WebM
- 기본 포트: 3000

## 문제 해결

### 자주 발생하는 오류

1. **AWS 자격 증명 오류**
   - `.env` 파일의 AWS 키 설정을 확인하세요
   - IAM 권한을 확인하세요

2. **S3 업로드 실패**
   - 버킷 이름과 리전 설정을 확인하세요
   - CORS 설정이 올바른지 확인하세요

3. **분석 작업 실패**
   - 영상 파일 포맷이 지원되는지 확인하세요
   - AWS Transcribe/Rekognition 리전 지원을 확인하세요

## 라이선스

MIT License
