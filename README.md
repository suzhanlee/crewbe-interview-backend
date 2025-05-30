# 승무원 준비생 앱 (Flight Attendant Interview App)

모의 면접을 위한 React Native 웹/모바일 애플리케이션입니다. MediaRecorder API(웹)와 expo-camera(모바일)를 사용하여 개발되었습니다.

## 🚀 시작하기

### 필수 요구사항

- Node.js (v16 이상)
- npm 또는 yarn
- Expo CLI
- Android Studio (Android 개발용)

### 설치 방법

1. 저장소 클론
```bash
git clone [repository-url]
cd didim-new-expo
```

2. 의존성 설치
```bash
npm install
```

3. 환경변수 설정
```bash
# .env.example을 복사하여 .env 파일 생성
cp .env.example .env

# .env 파일에 실제 AWS 정보 입력
# AWS_ACCESS_KEY_ID=your_actual_access_key
# AWS_SECRET_ACCESS_KEY=your_actual_secret_key
# AWS_REGION=ap-northeast-2
# AWS_S3_BUCKET=your-profile-bucket-name
# AWS_S3_RECORDING_BUCKET=your-recording-bucket-name
```

4. 개발 서버 실행
```bash
# 웹에서 실행
npm run web

# Android에서 실행  
npm run android

# iOS에서 실행
npm run ios

# 개발 서버 시작
npm start
```

## 📱 구현된 기능

### 1. 사용자 관리
- 사용자 이름 입력 및 프로필 관리
- 프로필 화면에서 면접 기록 조회
- 면접 피드백 상세 보기

### 2. 모의 면접 시스템
- **웹**: MediaRecorder API를 사용한 실시간 녹화 및 S3 업로드
- **모바일**: expo-camera를 사용한 카메라 기반 면접 진행
- 항공사별 맞춤 면접 질문 제공
- 면접 시간 타이머 기능
- 면접 종료 후 AI 기반 분석 리포트 제공
  - 음성 정확도 분석
  - 표정 분석
  - 말투 및 속도 분석
  - 답변 퀄리티 평가
  - 개선사항 및 추천 조치사항 제공

### 3. 일정 관리
- 캘린더 기반 일정 관리
- 일정 추가/수정/삭제 기능
- 다가오는 일정 홈 화면 표시
- 급여 관리 기능 (월별 기록)

### 4. 홈 화면
- 사용자 맞춤 인사말
- 다가오는 일정 미리보기
- 빠른 면접 시작 기능

## 🗂 프로젝트 구조

```
didim-new-expo/
├── src/
│   ├── components/       # 재사용 가능한 컴포넌트
│   │   ├── common/      # 공통 컴포넌트 (Button 등)
│   │   └── Interview.tsx # 웹 전용 인터뷰 컴포넌트
│   ├── screens/         # 화면 컴포넌트
│   │   ├── Home/        # 홈 화면
│   │   ├── Profile/     # 프로필 화면
│   │   ├── Schedule/    # 일정 관리 화면
│   │   ├── MockInterview/ # 모의 면접 화면 (웹/모바일 통합)
│   │   └── UserNameInput/ # 사용자 이름 입력 화면
│   ├── hooks/           # React Hooks
│   │   └── useRecorder.ts # 웹 전용 MediaRecorder 훅
│   ├── contexts/        # React Context 정의
│   ├── models/          # 데이터 모델 정의
│   ├── api/             # API 통신 관련
│   ├── config/          # 설정 파일
│   │   └── aws.config.ts # AWS 설정
│   ├── types/           # TypeScript 타입 정의
│   ├── utils/           # 유틸리티 함수
│   └── constants.ts     # 상수 정의
├── android/             # Android 네이티브 설정
├── docs/               # 프로젝트 문서
├── App.tsx             # 앱의 진입점
├── app.config.js       # Expo 설정
├── package.json        # 프로젝트 의존성 관리
├── .env                # 환경변수 (gitignore)
└── .env.example        # 환경변수 템플릿
```

## 🛠 기술 스택

### 프론트엔드
- React Native
- Expo
- TypeScript
- React Navigation
- React Context API

### 웹 전용 기능
- MediaRecorder API
- WebRTC
- HTML5 Video

### 모바일 전용 기능
- expo-camera
- 네이티브 카메라 권한

### 백엔드/클라우드
- AWS S3 (파일 저장)
- AWS SDK v3
- Pre-signed URLs

### 개발 도구
- Metro Bundler
- Babel
- ESLint
- TypeScript

## 🌐 플랫폼별 지원 기능

| 기능 | 웹 | Android | iOS |
|------|-----|---------|-----|
| 기본 네비게이션 | ✅ | ✅ | ✅ |
| 카메라 미리보기 | ✅ | ✅ | ✅ |
| 면접 녹화 | ✅ (MediaRecorder) | ✅ (expo-camera) | ✅ (expo-camera) |
| S3 업로드 | ✅ | ✅ | ✅ |
| 실시간 로그 | ✅ | ❌ | ❌ |
| 터미널 스타일 UI | ✅ | ❌ | ❌ |

## 📚 문서

- [FEATURES_GUIDE.md](./FEATURES_GUIDE.md) - 기능별 상세 가이드
- [프로젝트 규칙](./docs/PROJECT_RULES.mdx) - 코딩 컨벤션, 네비게이션 규칙

## 🔧 개발 가이드

### 환경 설정
1. `.env` 파일에 AWS 자격증명 설정
2. S3 버킷 권한 설정 (CORS, Pre-signed URL)
3. 개발용 도메인 화이트리스트 추가

### 웹 개발
- MediaRecorder API 브라우저 호환성 확인
- Chrome 47+, Firefox 25+, Safari 14.1+ 지원

### 모바일 개발
- expo-camera 권한 설정
- Android/iOS 빌드 설정

## 🤝 기여하기

1. 이슈 생성 또는 기존 이슈 확인
2. 새로운 브랜치 생성 (`feature/기능명` 또는 `fix/버그명`)
3. 변경사항 커밋
4. Pull Request 생성

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 연락처

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.
