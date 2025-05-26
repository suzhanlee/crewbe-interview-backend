import React, { createContext, useContext, useState } from 'react';
import { DetailedScore } from '../models/InterviewFeedback';

export interface InterviewFeedback {
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

interface InterviewContextType {
  feedbacks: InterviewFeedback[];
  setFeedbacks: React.Dispatch<React.SetStateAction<InterviewFeedback[]>>;
}

const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

export const InterviewProvider = ({ children }: { children: React.ReactNode }) => {
  const [feedbacks, setFeedbacks] = useState<InterviewFeedback[]>([]);

  return (
    <InterviewContext.Provider value={{ feedbacks, setFeedbacks }}>
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterviews = () => {
  const context = useContext(InterviewContext);
  if (context === undefined) {
    throw new Error('useInterviews must be used within a InterviewProvider');
  }
  return context;
}; 