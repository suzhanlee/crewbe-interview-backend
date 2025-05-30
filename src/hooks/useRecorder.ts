import { useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { PRESIGNED_PUT_URL, RECORDER_CONFIG, generateS3Key } from '../constants';
import { startAnalysis, pollAnalysisResults } from '../utils/awsAnalysis';

interface UseRecorderReturn {
  isRecording: boolean;
  isUploading: boolean;
  isAnalyzing: boolean;
  stream: MediaStream | null;
  error: string | null;
  logs: string[];
  start: () => Promise<void>;
  stop: () => Promise<void>;
  clearLogs: () => void;
}

export const useRecorder = (): UseRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const currentS3KeyRef = useRef<string>('');

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const start = useCallback(async () => {
    try {
      setError(null);
      // S3 키 미리 생성
      currentS3KeyRef.current = generateS3Key();
      addLog(`S3 Key 생성: ${currentS3KeyRef.current}`);
      addLog('카메라 및 마이크 권한 요청 중...');

      // 미디어 스트림 획득
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: true
      });

      setStream(mediaStream);
      addLog('미디어 스트림 획득 완료');

      // MediaRecorder 생성
      const mediaRecorder = new MediaRecorder(mediaStream, RECORDER_CONFIG);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // 녹화 데이터 수집
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          addLog(`녹화 데이터 수집: ${event.data.size} bytes`);
        }
      };

      // 녹화 완료 시 업로드 및 분석
      mediaRecorder.onstop = async () => {
        addLog('녹화 완료, 업로드 준비 중...');
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const success = await upload(blob);
        
        if (success) {
          // 웹 환경에서는 분석 건너뛰기
          if (Platform.OS === 'web') {
            addLog('⚠️ 웹 환경에서는 AWS 분석이 지원되지 않습니다');
            addLog('✅ 녹화 및 업로드 완료!');
          } else {
            // 모바일 환경에서만 분석 시작
            await performAnalysis(currentS3KeyRef.current);
          }
        }
      };

      // 녹화 시작
      mediaRecorder.start(1000); // 1초마다 데이터 수집
      setIsRecording(true);
      addLog('녹화 시작됨');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(errorMessage);
      addLog(`녹화 시작 실패: ${errorMessage}`);
    }
  }, [addLog]);

  const stop = useCallback(async () => {
    try {
      if (mediaRecorderRef.current && isRecording) {
        addLog('녹화 중단 중...');
        mediaRecorderRef.current.stop();
        setIsRecording(false);

        // 스트림 정리
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(errorMessage);
      addLog(`녹화 중단 실패: ${errorMessage}`);
    }
  }, [isRecording, stream, addLog]);

  const upload = useCallback(async (blob: Blob): Promise<boolean> => {
    setIsUploading(true);
    addLog(`업로드 시작 - 파일 크기: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);

    try {
      // 웹 환경에서는 실제 업로드 건너뛰기 (시뮬레이션)
      if (Platform.OS === 'web') {
        addLog('⚠️ 웹 환경에서는 실제 S3 업로드가 비활성화되었습니다');
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기 시뮬레이션
        addLog('✅ 업로드 시뮬레이션 완료!');
        setError(null);
        return true;
      }

      // Pre-Signed URL로 PUT 요청 (모바일에서만)
      const response = await fetch(PRESIGNED_PUT_URL, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': 'video/webm',
        },
      });

      if (response.ok) {
        addLog('✅ S3 업로드 성공!');
        setError(null);
        return true;
      } else {
        throw new Error(`업로드 실패: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '업로드 실패';
      setError(errorMessage);
      addLog(`❌ 업로드 실패: ${errorMessage}`);
      return false;
    } finally {
      setIsUploading(false);
    }
  }, [addLog]);

  // AWS 분석 수행 (모바일에서만)
  const performAnalysis = useCallback(async (s3Key: string) => {
    if (Platform.OS === 'web') {
      addLog('⚠️ 웹 환경에서는 AWS 분석을 건너뜁니다');
      return;
    }

    setIsAnalyzing(true);
    try {
      addLog('🚀 AWS 분석 시작...');
      
      // 분석 작업들 시작
      const jobs = await startAnalysis(s3Key, addLog);
      
      // 폴링으로 결과 대기
      const results = await pollAnalysisResults(jobs, addLog);
      
      addLog('🎉 모든 분석 작업 완료!');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '분석 실패';
      addLog(`❌ 분석 실패: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, [addLog]);

  return {
    isRecording,
    isUploading,
    isAnalyzing,
    stream,
    error,
    logs,
    start,
    stop,
    clearLogs,
  };
}; 