import React, { createContext, useContext, useState } from 'react';

export interface ScheduleEntry {
  id: string;
  date: string;
  title: string;
  description: string;
}

interface ScheduleContextType {
  schedules: ScheduleEntry[];
  setSchedules: React.Dispatch<React.SetStateAction<ScheduleEntry[]>>;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider = ({ children }: { children: React.ReactNode }) => {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);

  return (
    <ScheduleContext.Provider value={{ schedules, setSchedules }}>
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedules = () => {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedules must be used within a ScheduleProvider');
  }
  return context;
}; 