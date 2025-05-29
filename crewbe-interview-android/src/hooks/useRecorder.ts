import { useState, useRef, useCallback } from 'react';
import { PRESIGNED_PUT_URL, RECORDER_CONFIG } from '../constants';

interface UseRecorderReturn {
  isRecording: boolean;
  isUploading: boolean;
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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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

      // 녹화 완료 시 업로드
      mediaRecorder.onstop = async () => {
        addLog('녹화 완료, 업로드 준비 중...');
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        await upload(blob);
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
      // Pre-Signed URL로 PUT 요청
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

  return {
    isRecording,
    isUploading,
    stream,
    error,
    logs,
    start,
    stop,
    clearLogs,
  };
}; 