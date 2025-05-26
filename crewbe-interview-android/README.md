# CrewBe Interview Android

모의 면접을 위한 React Native 기반의 안드로이드 애플리케이션입니다.

## 주요 기능

### 1. 사용자 인증
- 사용자 이름 입력 화면 (`UserNameInput`)
  - 첫 실행 시 사용자 이름을 입력받아 저장
  - 로컬 스토리지를 통한 사용자 정보 관리

### 2. 메인 탭 네비게이션
앱은 다음과 같은 4개의 주요 탭으로 구성되어 있습니다:

#### 홈 화면 (`Home`)
- 사용자의 모의 면접 현황 대시보드
- 최근 면접 기록 및 통계
- 추천 면접 주제 및 팁

#### 프로필 화면 (`Profile`)
- 사용자 프로필 정보 관리
- 면접 통계 및 성과 분석
- 면접 히스토리 조회

#### 일정 화면 (`Schedule`)
- 모의 면접 일정 관리
- 면접 일정 등록 및 수정
- 캘린더 뷰를 통한 일정 확인

#### 모의 면접 화면 (`MockInterview`)
- 실시간 모의 면접 진행
- 면접 질문 및 답변 녹화
- 면접 피드백 및 평가

## 기술 스택

- **프레임워크**: React Native
- **언어**: TypeScript
- **상태 관리**: React Context API
- **네비게이션**: React Navigation
- **스타일링**: React Native StyleSheet

## 프로젝트 구조

```
crewbe-interview-android/
├── src/
│   ├── api/         # API 통신 관련 로직
│   ├── components/  # 재사용 가능한 UI 컴포넌트
│   ├── contexts/    # React Context 관련 파일
│   ├── models/      # 데이터 모델 및 타입 정의
│   ├── screens/     # 화면 컴포넌트
│   ├── types/       # TypeScript 타입 정의
│   └── utils/       # 유틸리티 함수
```

## 시작하기

### 필수 요구사항
- Node.js 14.0.0 이상
- npm 또는 yarn
- Android Studio
- Android SDK

### 설치 및 실행
1. 저장소 클론
```bash
git clone [repository-url]
cd crewbe-interview-android
```

2. 의존성 설치
```bash
npm install
# 또는
yarn install
```

3. 개발 서버 실행
```bash
npm start
# 또는
yarn start
```

4. 안드로이드 앱 실행
```bash
npm run android
# 또는
yarn android
```

## 개발 가이드

자세한 개발 가이드와 코딩 규칙은 [RULES.mdx](./RULES.mdx) 파일을 참고해주세요.

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
