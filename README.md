# 승무원 면접 준비 앱 (Flight Attendant Interview App)

AI 기반 승무원 면접 시뮬레이션 및 분석 플랫폼

## 📋 목차
- [프로젝트 개요](#프로젝트-개요)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [설치 및 실행](#설치-및-실행)
- [환경 변수 설정](#환경-변수-설정)
- [AWS 서비스 연동](#aws-서비스-연동)
- [플랫폼별 기능](#플랫폼별-기능)
- [사용법](#사용법)
- [API 문서](#api-문서)

## 🎯 프로젝트 개요

승무원 지원자들이 실제 면접 환경을 시뮬레이션하고, AI 기반 분석을 통해 면접 성과를 향상시킬 수 있는 종합적인 모바일/웹 애플리케이션입니다.

### 핵심 가치
- **실전 같은 면접 연습**: 실제 항공사 면접 질문과 환경 제공
- **AI 기반 분석**: AWS AI 서비스를 활용한 음성, 얼굴, 감정 분석
- **개인화된 피드백**: 상세한 분석 결과와 개선 방안 제시
- **크로스 플랫폼**: 웹과 모바일에서 동일한 경험 제공

## ✨ 주요 기능

### 🎬 비디오 면접 시뮬레이션
- **실시간 녹화**: 720p 30fps 고품질 비디오 녹화
- **미디어 스트림 관리**: 카메라/마이크 권한 및 품질 제어
- **다양한 코덱 지원**: WebM(VP8+Opus) 최적화

### 🧠 AI 기반 분석 시스템
- **음성-텍스트 변환(STT)**: Amazon Transcribe 한국어 지원
- **얼굴 감지 및 분석**: Amazon Rekognition 얼굴 속성 분석
- **감정 및 세그먼트 분석**: 비디오 내 감정 변화 추적
- **실시간 폴링**: 5초 간격 분석 진행상황 모니터링

### 📊 상세한 분석 리포트
- **종합 점수**: 음성 정확도, 표정, 말투, 답변 품질 등급
- **개선사항 제안**: AI 기반 개인화된 피드백
- **시각적 데이터**: 그래프와 차트로 성과 시각화
- **이력 관리**: 면접 기록 저장 및 진행상황 추적

### 👤 프로필 관리 시스템
- **개인정보 관리**: 기본 정보, 스펙 입력
- **파일 업로드**: 증명사진, 자기소개 영상 등
- **S3 연동**: 안전한 클라우드 저장소
- **실시간 미리보기**: 업로드된 콘텐츠 즉시 확인

### 🛡️ 고급 로깅 시스템
- **상세 프로세스 로깅**: 모든 단계별 진행상황 기록
- **실시간 모니터링**: ScrollView 기반 로그 뷰어
- **에러 추적**: 스택 트레이스 및 디버깅 정보
- **성능 측정**: 업로드 속도, 처리 시간 등 메트릭

## 🚀 기술 스택

### Frontend
- **React Native**: 크로스 플랫폼 모바일 개발
- **Expo SDK 53**: 개발 및 빌드 도구
- **TypeScript**: 타입 안전성
- **React Navigation**: 화면 네비게이션

### Backend & Cloud
- **AWS S3**: 파일 저장소
- **AWS Transcribe**: 음성-텍스트 변환
- **AWS Rekognition**: 얼굴/감정 인식
- **Pre-signed URLs**: 보안 파일 업로드

### Media & Streaming
- **MediaRecorder API**: 브라우저 녹화
- **expo-camera**: 모바일 카메라 제어
- **expo-image-picker**: 이미지 선택
- **expo-document-picker**: 문서 선택

### Development Tools
- **Metro Bundler**: 빌드 도구
- **ESLint**: 코드 품질
- **Expo Dev Tools**: 디버깅

## 📁 프로젝트 구조

```
didim-new-expo/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   └── Button.tsx              # 공통 버튼 컴포넌트
│   │   └── Interview.tsx               # 면접 관련 컴포넌트
│   │
│   ├── config/
│   │   └── aws.config.ts              # AWS 서비스 설정
│   │
│   ├── contexts/
│   │   ├── InterviewContext.tsx       # 면접 상태 관리
│   │   └── UserContext.tsx            # 사용자 정보 관리
│   │
│   ├── hooks/
│   │   └── useRecorder.ts             # 녹화 훅 (상세 로깅 포함)
│   │
│   ├── models/
│   │   ├── Airline.tsx                # 항공사 데이터 모델
│   │   └── InterviewFeedback.tsx      # 피드백 데이터 모델
│   │
│   ├── screens/
│   │   ├── Home/
│   │   │   └── index.tsx              # 홈 화면
│   │   ├── MockInterview/
│   │   │   └── index.tsx              # 면접 시뮬레이션 화면
│   │   ├── Profile/
│   │   │   └── index.tsx              # 프로필 조회 화면
│   │   ├── ProfileEdit.tsx            # 프로필 편집 화면
│   │   └── InterviewHistory/
│   │       └── index.tsx              # 면접 이력 화면
│   │
│   ├── types/
│   │   ├── navigation.ts              # 네비게이션 타입
│   │   └── profile.ts                 # 프로필 타입
│   │
│   ├── utils/
│   │   ├── awsAnalysis.ts             # AWS AI 분석 로직 (상세 로깅)
│   │   └── s3Upload.ts                # S3 업로드 유틸리티
│   │
│   ├── constants.ts                   # 앱 상수 및 설정
│   └── api.ts                         # API 클라이언트
│
├── .env                               # 환경 변수
├── app.config.js                      # Expo 설정
├── metro.config.js                    # Metro 번들러 설정
├── tsconfig.json                      # TypeScript 설정
├── package.json                       # 의존성 관리
└── README.md                          # 프로젝트 문서
```

## 🛠️ 설치 및 실행

### 필수 조건
- Node.js 18+ 
- npm 또는 yarn
- Expo CLI
- Android Studio (안드로이드 개발)
- Xcode (iOS 개발)

### 설치
```bash
# 레포지토리 클론
git clone <repository-url>
cd didim-new-expo

# 의존성 설치
npm install --legacy-peer-deps

# Expo 개발 서버 시작
npx expo start

# 플랫폼별 실행
npx expo start --web      # 웹 브라우저
npx expo start --android  # 안드로이드
npx expo start --ios      # iOS
```

## ⚙️ 환경 변수 설정

`.env` 파일을 프로젝트 루트에 생성하고 다음 변수들을 설정하세요:

```env
# AWS 자격 증명
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=ap-northeast-2

# S3 버킷 설정
AWS_S3_BUCKET=flight-attendant-profiles          # 프로필 파일용
AWS_S3_RECORDING_BUCKET=flight-attendant-recordings  # 면접 녹화용
```

### `app.config.js`에서 환경 변수 매핑
```javascript
export default {
  expo: {
    extra: {
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      AWS_REGION: process.env.AWS_REGION,
      AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
      AWS_S3_RECORDING_BUCKET: process.env.AWS_S3_RECORDING_BUCKET,
    }
  }
}
```

## ☁️ AWS 서비스 연동

### 필요한 AWS 서비스
1. **Amazon S3**: 파일 저장
2. **Amazon Transcribe**: 음성-텍스트 변환
3. **Amazon Rekognition**: 얼굴/감정 인식

### S3 버킷 구조
```
flight-attendant-profiles/           # 프로필 관련 파일
├── photos/                         # 증명사진
├── videos/                         # 자기소개 영상
└── documents/                      # 서류

flight-attendant-recordings/        # 면접 녹화 파일
├── videos/                         # 면접 영상
└── interview-<timestamp>-<id>.webm

crewbe-analysis-results/            # AI 분석 결과
├── transcriptions/                 # STT 결과
├── face-analysis/                  # 얼굴 분석 결과
└── emotion-analysis/               # 감정 분석 결과
```

### IAM 권한 설정
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::flight-attendant-*/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "transcribe:StartTranscriptionJob",
        "transcribe:GetTranscriptionJob",
        "rekognition:StartFaceDetection",
        "rekognition:GetFaceDetection",
        "rekognition:StartSegmentDetection",
        "rekognition:GetSegmentDetection"
      ],
      "Resource": "*"
    }
  ]
}
```

## 📱 플랫폼별 기능

### 웹 환경 (Browser)
```
✅ 비디오 녹화 (MediaRecorder API)
✅ 실시간 스트림 프리뷰
✅ 업로드 시뮬레이션
✅ 상세 로깅 시스템
⚠️ AWS 분석 비활성화 (브라우저 보안 제한)
```

### 모바일 환경 (Android/iOS)
```
✅ 카메라 녹화 (CameraView)
✅ 실제 S3 업로드
✅ AWS STT 분석
✅ AWS 얼굴 감지
✅ AWS 감정 분석
✅ 5초 간격 폴링
✅ 완전한 분석 파이프라인
```

## 📖 사용법

### 1. 프로필 설정
```typescript
// 프로필 편집 화면에서
const profileData = {
  gender: 'female',      // 필수
  age: 25,              // 필수
  height: 165,          // 선택
  weight: 55,           // 선택
  university: 'Seoul National University',
  gpa: 3.8,
  languageScores: {
    toeic: 950,
    opic: 'AL'
  }
};
```

### 2. 면접 시뮬레이션
```typescript
// 면접 진행 과정
1. 항공사 선택 (대한항공, 아시아나, 진에어 등)
2. 카메라 권한 허용
3. 면접 시작 → 자동 녹화 시작
4. 질문에 답변
5. 면접 종료 → 자동 업로드 및 분석
6. 결과 확인
```

### 3. 로그 모니터링
```typescript
// 상세 로깅 예시
[14:30:15] 🎬 면접 녹화 시작 프로세스 시작
[14:30:15] 📝 S3 파일 키 생성: videos/interview-1703123415-abc123.webm
[14:30:15] 📂 저장될 S3 경로: s3://crewbe-video-uploads/videos/interview-1703123415-abc123.webm
[14:30:16] 🎥 미디어 디바이스 권한 요청 중...
[14:30:16] ✅ 미디어 스트림 획득 성공
[14:30:16] 📹 비디오 트랙 수: 1
[14:30:16] 🎤 오디오 트랙 수: 1
[14:30:16] 📐 실제 해상도: 1280x720
[14:30:16] 🎞️ 실제 프레임레이트: 30fps
```

## 🔧 개발 가이드

### 새로운 분석 기능 추가
```typescript
// src/utils/awsAnalysis.ts에 새 함수 추가
export const startNewAnalysis = async (
  s3Key: string,
  logCallback: (message: string) => void
): Promise<string> => {
  logCallback('🔍 새로운 분석 시작...');
  // 구현 로직
};
```

### 커스텀 로깅 추가
```typescript
// useRecorder.ts에서 로깅 패턴
const addLog = useCallback((message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  console.log(`[RECORDER] ${message}`);
}, []);

// 사용 예시
addLog('🎯 새로운 프로세스 시작');
addLog('📊 진행률: 50%');
addLog('✅ 프로세스 완료');
```

### 디버깅 팁
```bash
# 로그 확인
npx expo start --web
# 브라우저 개발자 도구에서 [RECORDER] 로그 확인

# Metro 캐시 클리어
npx expo start --clear

# 특정 플랫폼 실행
npx expo run:android
npx expo run:ios
```

## 🐛 문제 해결

### 일반적인 문제들

#### 1. AWS SDK 웹 호환성 문제
```
해결: 플랫폼별 조건부 로딩 구현됨
웹에서는 더미 객체 사용, 모바일에서는 실제 AWS SDK 사용
```

#### 2. Camera 타입 에러
```
해결: expo-camera v16 API 사용
CameraView 컴포넌트와 facing="front" 속성 사용
```

#### 3. Metro 번들러 에러
```
해결: metro.config.js에서 AWS SDK alias 설정
config.resolver.alias = { 'aws-sdk': false }
```

### 로그 기반 디버깅
```typescript
// 문제 발생 시 로그에서 확인할 내용:
1. 🎬 프로세스 시작 여부
2. 📱 권한 획득 성공/실패
3. 📦 데이터 청크 수집 상태
4. ☁️ 업로드 진행률
5. 🧠 AWS 분석 상태
6. 💥 에러 발생 지점 및 스택 트레이스
```

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 생성해 주세요.

---

**구현 완료 기능들:**
- ✅ 비디오 녹화 및 S3 업로드
- ✅ AWS AI 분석 (STT, 얼굴감지, 감정분석)
- ✅ 실시간 상세 로깅 시스템
- ✅ 프로필 관리 시스템
- ✅ 크로스 플랫폼 지원 (웹/모바일)
- ✅ 면접 시뮬레이션 및 피드백
- ✅ 환경 변수 기반 설정
- ✅ 에러 처리 및 디버깅 도구
