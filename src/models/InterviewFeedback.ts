export interface DetailedScore {
  voiceAccuracy: number;
  expression: number;
  speechPattern: number;
  answerQuality: number;
}

export interface InterviewReport {
  id: string;
  date: string;
  airline: string;
  username: string;
  score: number;
  feedback: string;
  duration: number;
  improvements: string[];
  grade: string;
  detailedScores: DetailedScore;
  voiceAnalysis: string;
  expressionAnalysis: string;
  speechAnalysis: string;
  answerAnalysis: string;
  detailedFeedback: {
    voiceAccuracyDetail: string;
    expressionDetail: string;
    speechPatternDetail: string;
    answerQualityDetail: string;
  };
  recommendedActions: string[];
}

export interface FeedbackDetail {
  candidateName: string;
  airline: string;
  position: string;
  interviewDate: string;
  version: string;
  totalScore: number;
  grade: string;
  detailedScores: DetailedScore;
  overallEvaluation: string;
  voiceAnalysis: string;
  expressionAnalysis: string;
  speechAnalysis: string;
  answerAnalysis: string;
  improvements: string[];
  detailedFeedback: {
    voiceAccuracyDetail: string;
    expressionDetail: string;
    speechPatternDetail: string;
    answerQualityDetail: string;
  };
  recommendedActions: string[];
}

export const FEEDBACK_TEMPLATES: FeedbackDetail[] = [
  {
    candidateName: '',
    airline: '',
    position: '객실 승무원',
    interviewDate: '',
    version: 'AI 면접 테스트 V1.0',
    totalScore: 95,
    grade: 'A (합격 예상)',
    detailedScores: {
      voiceAccuracy: 95,
      expression: 96,
      speechPattern: 94,
      answerQuality: 95
    },
    overallEvaluation: "탁월한 면접 수행을 보여주었습니다. 전문성과 친근함의 균형이 완벽했으며, 모든 답변이 구체적이고 설득력 있었습니다.",
    voiceAnalysis: "매우 안정적이고 전문적인 음성과 발음으로 신뢰감을 주었습니다.",
    expressionAnalysis: "자연스러운 미소와 자신감 있는 표정을 완벽하게 유지했습니다.",
    speechAnalysis: "체계적이고 논리적인 답변 구성이 매우 인상적이었습니다.",
    answerAnalysis: "모든 질문에 대해 구체적이고 설득력 있는 사례를 제시했습니다.",
    improvements: [
      "현재의 우수한 수준을 유지하면서 더 다양한 상황에 대한 준비",
      "글로벌 서비스 역량을 더욱 강화",
      "리더십 경험 추가 준비"
    ],
    detailedFeedback: {
      voiceAccuracyDetail: "발음이 매우 정확하고 음성 톤이 안정적이며, 고객 응대에 최적화된 어투를 구사했습니다.",
      expressionDetail: "전문적이고 친근한 표정 관리가 완벽했으며, 자연스러운 눈맞춤으로 신뢰감을 주었습니다.",
      speechPatternDetail: "답변 속도와 톤 조절이 탁월했으며, 전문 용어 사용이 적절했습니다.",
      answerQualityDetail: "모든 답변이 STAR 기법으로 잘 구성되었으며, 항공사의 가치를 정확히 이해하고 있음을 보여주었습니다."
    },
    recommendedActions: [
      "글로벌 서비스 역량 강화를 위한 해외 항공사 사례 연구",
      "리더십 역량 개발을 위한 추가 경험 준비",
      "항공 산업 최신 트렌드 학습",
      "다양한 문화권 승객 응대 시나리오 준비"
    ]
  },
  {
    candidateName: '',
    airline: '',
    position: '객실 승무원',
    interviewDate: '',
    version: 'AI 면접 테스트 V1.0',
    totalScore: 85,
    grade: 'B (보완 후 재도전)',
    detailedScores: {
      voiceAccuracy: 85,
      expression: 84,
      speechPattern: 86,
      answerQuality: 85
    },
    overallEvaluation: "기본적인 면접 역량은 갖추고 있으나, 일부 영역에서 보완이 필요합니다. 준비를 더 하면 충분히 합격할 수 있는 잠재력이 있습니다.",
    voiceAnalysis: "발음은 명확하나 일부 긴장된 상황에서 음성이 불안정했습니다.",
    expressionAnalysis: "기본적인 미소는 유지했으나, 예상치 못한 질문에서 표정이 경직되었습니다.",
    speechAnalysis: "답변의 논리성은 좋았으나, 속도 조절이 필요합니다.",
    answerAnalysis: "기본적인 답변 구성은 좋았으나, 구체적인 사례 제시가 부족했습니다.",
    improvements: [
      "긴장 상황에서의 음성 안정성 향상 필요",
      "표정의 자연스러움 개선 필요",
      "답변의 구체성 보완 필요"
    ],
    detailedFeedback: {
      voiceAccuracyDetail: "기본적인 발음은 좋으나, 긴장 시 목소리가 떨리는 현상이 있어 개선이 필요합니다.",
      expressionDetail: "전반적인 표정은 좋으나, 돌발 질문에서 당황하는 모습이 표정에 드러났습니다.",
      speechPatternDetail: "답변 구성은 좋으나, 속도 조절과 강약 조절이 더 필요합니다.",
      answerQualityDetail: "답변의 기본 구조는 좋으나, 구체적인 경험 사례가 부족했습니다."
    },
    recommendedActions: [
      "스피치 트레이닝을 통한 음성 안정화",
      "모의면접을 통한 돌발 상황 대처 연습",
      "구체적인 경험 사례 정리",
      "서비스 관련 전문 지식 보완"
    ]
  },
  {
    candidateName: '',
    airline: '',
    position: '객실 승무원',
    interviewDate: '',
    version: 'AI 면접 테스트 V1.0',
    totalScore: 70,
    grade: 'C (기본기 보완 필요)',
    detailedScores: {
      voiceAccuracy: 72,
      expression: 70,
      speechPattern: 68,
      answerQuality: 70
    },
    overallEvaluation: "기본적인 면접 준비가 부족해 보입니다. 서비스 마인드는 보이나, 전반적인 면접 역량 향상이 필요합니다.",
    voiceAnalysis: "발음이 불명확하고 음성이 불안정한 경우가 많았습니다.",
    expressionAnalysis: "긴장으로 인해 표정이 경직되어 있었고, 미소가 부자연스러웠습니다.",
    speechAnalysis: "답변이 체계적이지 못하고, 속도 조절이 미흡했습니다.",
    answerAnalysis: "답변이 피상적이었으며, 구체적인 사례 제시가 거의 없었습니다.",
    improvements: [
      "기본적인 발음과 음성 훈련 필요",
      "표정 관리 기본기 향상 필요",
      "답변 구성력 개선 필요"
    ],
    detailedFeedback: {
      voiceAccuracyDetail: "전반적인 발음 교정과 음성 톤 안정화 훈련이 필요합니다.",
      expressionDetail: "기본적인 표정 관리와 자연스러운 미소 훈련이 필요합니다.",
      speechPatternDetail: "답변 속도 조절과 기본적인 스피치 훈련이 필요합니다.",
      answerQualityDetail: "STAR 기법을 활용한 기본적인 답변 구성 연습이 필요합니다."
    },
    recommendedActions: [
      "기본적인 발음과 스피치 교정 훈련",
      "표정 관리 기초 연습",
      "면접 답변 기본 구성법 학습",
      "항공사 기본 지식 습득"
    ]
  }
];

export function getRandomFeedback(airline: string, candidateName: string): FeedbackDetail {
  const randomTemplate = FEEDBACK_TEMPLATES[Math.floor(Math.random() * FEEDBACK_TEMPLATES.length)];
  return {
    ...randomTemplate,
    airline,
    candidateName,
    interviewDate: new Date().toISOString().split('T')[0]
  };
} 