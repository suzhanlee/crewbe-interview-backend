import React, { createContext, useContext, useState } from 'react';

export interface InterviewFeedback {
  id: string;
  date: string;
  airline: string;
  score: number;
  feedback: string;
  duration: number;
  improvements: string[];
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