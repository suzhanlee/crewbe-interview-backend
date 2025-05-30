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
    console.log(`[RECORDER] ${message}`);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const start = useCallback(async () => {
    try {
      setError(null);
      addLog('🎬 =========================');
      addLog('🎬 면접 녹화 시작 프로세스 시작');
      addLog('🎬 =========================');
      
      // S3 키 미리 생성
      currentS3KeyRef.current = generateS3Key();
      addLog(`📝 S3 파일 키 생성: ${currentS3KeyRef.current}`);
      addLog(`📂 저장될 S3 경로: s3://crewbe-video-uploads/${currentS3KeyRef.current}`);
      
      addLog('🎥 미디어 디바이스 권한 요청 중...');
      addLog('📱 요청 사양: 1280x720, 30fps, 오디오 포함');

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
      addLog('✅ 미디어 스트림 획득 성공');
      addLog(`📹 비디오 트랙 수: ${mediaStream.getVideoTracks().length}`);
      addLog(`🎤 오디오 트랙 수: ${mediaStream.getAudioTracks().length}`);
      
      // 스트림 품질 정보 로깅
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        addLog(`📐 실제 해상도: ${settings.width}x${settings.height}`);
        addLog(`🎞️  실제 프레임레이트: ${settings.frameRate}fps`);
        addLog(`📱 카메라 디바이스: ${settings.deviceId || 'Unknown'}`);
      }

      // MediaRecorder 생성
      addLog('🎮 MediaRecorder 초기화 중...');
      addLog(`🔧 코덱 설정: ${RECORDER_CONFIG.mimeType}`);
      addLog(`📊 비디오 비트레이트: ${RECORDER_CONFIG.videoBitsPerSecond / 1000}kbps`);
      addLog(`🔊 오디오 비트레이트: ${RECORDER_CONFIG.audioBitsPerSecond / 1000}kbps`);
      
      const mediaRecorder = new MediaRecorder(mediaStream, RECORDER_CONFIG);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // 녹화 데이터 수집
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          const chunkSizeMB = (event.data.size / 1024 / 1024).toFixed(2);
          const totalChunks = chunksRef.current.length;
          const totalSizeMB = (chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0) / 1024 / 1024).toFixed(2);
          addLog(`📦 데이터 청크 수집: ${chunkSizeMB}MB (청크 #${totalChunks}, 총 ${totalSizeMB}MB)`);
        }
      };

      // 녹화 시작 이벤트
      mediaRecorder.onstart = () => {
        addLog('🟢 녹화 시작됨 - 데이터 수집 활성화');
        addLog('⏱️  1초 간격으로 데이터 청크 생성 중...');
      };

      // 녹화 일시정지 이벤트
      mediaRecorder.onpause = () => {
        addLog('⏸️  녹화 일시정지');
      };

      // 녹화 재개 이벤트
      mediaRecorder.onresume = () => {
        addLog('▶️  녹화 재개');
      };

      // 녹화 완료 시 업로드 및 분석
      mediaRecorder.onstop = async () => {
        addLog('🛑 녹화 중단 완료');
        addLog('📊 녹화 통계 정리 중...');
        
        const totalChunks = chunksRef.current.length;
        const totalSize = chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
        const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
        
        addLog(`📈 녹화 완료 통계:`);
        addLog(`   • 총 청크 수: ${totalChunks}개`);
        addLog(`   • 총 파일 크기: ${totalSizeMB}MB`);
        addLog(`   • 평균 청크 크기: ${(totalSize / totalChunks / 1024).toFixed(2)}KB`);
        
        addLog('🔧 비디오 블롭 생성 중...');
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        addLog(`✅ 비디오 블롭 생성 완료: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
        
        const success = await upload(blob);
        
        if (success) {
          // 웹 환경에서는 분석 건너뛰기
          if (Platform.OS === 'web') {
            addLog('⚠️ 웹 환경에서는 AWS 분석이 지원되지 않습니다');
            addLog('✅ 녹화 및 업로드 완료!');
            addLog('🎯 면접 녹화 프로세스 종료');
          } else {
            // 모바일 환경에서만 분석 시작
            await performAnalysis(currentS3KeyRef.current);
          }
        }
      };

      // 에러 핸들링
      mediaRecorder.onerror = (event) => {
        addLog(`❌ MediaRecorder 에러: ${event.error || 'Unknown error'}`);
      };

      // 녹화 시작
      addLog('🚀 녹화 시작 명령 실행...');
      mediaRecorder.start(1000); // 1초마다 데이터 수집
      setIsRecording(true);
      addLog('✅ 녹화 상태 활성화');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(errorMessage);
      addLog(`💥 녹화 시작 실패: ${errorMessage}`);
      
      // 에러 세부사항 로깅
      if (err instanceof Error) {
        addLog(`🔍 에러 스택: ${err.stack || 'No stack trace'}`);
      }
    }
  }, [addLog]);

  const stop = useCallback(async () => {
    try {
      addLog('🛑 녹화 중단 요청 받음');
      
      if (mediaRecorderRef.current && isRecording) {
        addLog('⏹️  MediaRecorder 중단 중...');
        addLog(`📊 현재 상태: ${mediaRecorderRef.current.state}`);
        
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        addLog('✅ MediaRecorder 중단 완료');

        // 스트림 정리
        if (stream) {
          addLog('🧹 미디어 스트림 정리 중...');
          const videoTracks = stream.getVideoTracks();
          const audioTracks = stream.getAudioTracks();
          
          addLog(`📹 비디오 트랙 ${videoTracks.length}개 중단 중...`);
          videoTracks.forEach((track, index) => {
            track.stop();
            addLog(`   ✅ 비디오 트랙 #${index + 1} 중단됨`);
          });
          
          addLog(`🎤 오디오 트랙 ${audioTracks.length}개 중단 중...`);
          audioTracks.forEach((track, index) => {
            track.stop();
            addLog(`   ✅ 오디오 트랙 #${index + 1} 중단됨`);
          });
          
          setStream(null);
          addLog('✅ 모든 미디어 트랙 정리 완료');
        }
      } else {
        addLog('⚠️ 중단할 녹화가 없음 (이미 중단되었거나 시작되지 않음)');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(errorMessage);
      addLog(`💥 녹화 중단 실패: ${errorMessage}`);
    }
  }, [isRecording, stream, addLog]);

  const upload = useCallback(async (blob: Blob): Promise<boolean> => {
    setIsUploading(true);
    addLog('☁️ =============================');
    addLog('☁️ S3 업로드 프로세스 시작');
    addLog('☁️ =============================');
    
    const fileSizeMB = (blob.size / 1024 / 1024).toFixed(2);
    addLog(`📊 업로드 파일 정보:`);
    addLog(`   • 파일 크기: ${fileSizeMB}MB`);
    addLog(`   • 파일 타입: ${blob.type}`);
    addLog(`   • S3 키: ${currentS3KeyRef.current}`);

    try {
      // 웹 환경에서는 실제 업로드 건너뛰기 (시뮬레이션)
      if (Platform.OS === 'web') {
        addLog('⚠️ 웹 환경에서는 실제 S3 업로드가 비활성화되었습니다');
        addLog('🎭 업로드 시뮬레이션 시작...');
        addLog('⏳ 네트워크 지연 시뮬레이션 (2초)...');
        
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기 시뮬레이션
        
        addLog('✅ 업로드 시뮬레이션 완료!');
        addLog(`📍 시뮬레이션된 S3 URL: s3://crewbe-video-uploads/${currentS3KeyRef.current}`);
        setError(null);
        return true;
      }

      // Pre-Signed URL로 PUT 요청 (모바일에서만)
      addLog('🔗 Pre-Signed URL 준비 중...');
      addLog(`🌐 업로드 URL: ${PRESIGNED_PUT_URL.substring(0, 100)}...`);
      
      addLog('📤 HTTP PUT 요청 시작...');
      addLog('⏳ 파일 업로드 진행 중... (시간이 걸릴 수 있습니다)');
      
      const startTime = Date.now();
      
      const response = await fetch(PRESIGNED_PUT_URL, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': 'video/webm',
        },
      });

      const endTime = Date.now();
      const uploadTimeSeconds = ((endTime - startTime) / 1000).toFixed(2);
      const uploadSpeedMbps = (parseFloat(fileSizeMB) * 8 / parseFloat(uploadTimeSeconds)).toFixed(2);

      addLog(`⏱️ 업로드 완료 시간: ${uploadTimeSeconds}초`);
      addLog(`🚀 평균 업로드 속도: ${uploadSpeedMbps}Mbps`);
      addLog(`📊 HTTP 응답 상태: ${response.status} ${response.statusText}`);

      if (response.ok) {
        addLog('✅ S3 업로드 성공!');
        addLog(`📍 S3 URL: s3://crewbe-video-uploads/${currentS3KeyRef.current}`);
        addLog('🎯 업로드 프로세스 완료');
        setError(null);
        return true;
      } else {
        const responseText = await response.text();
        addLog(`📄 응답 내용: ${responseText.substring(0, 200)}...`);
        throw new Error(`업로드 실패: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '업로드 실패';
      setError(errorMessage);
      addLog(`💥 업로드 실패: ${errorMessage}`);
      
      if (err instanceof Error) {
        addLog(`🔍 에러 세부사항: ${err.stack || 'No stack trace'}`);
      }
      
      return false;
    } finally {
      setIsUploading(false);
      addLog('🏁 업로드 프로세스 종료');
    }
  }, [addLog]);

  // AWS 분석 수행 (모바일에서만)
  const performAnalysis = useCallback(async (s3Key: string) => {
    if (Platform.OS === 'web') {
      addLog('⚠️ 웹 환경에서는 AWS 분석을 건너뜁니다');
      return;
    }

    setIsAnalyzing(true);
    addLog('🧠 =============================');
    addLog('🧠 AWS AI 분석 프로세스 시작');
    addLog('🧠 =============================');
    
    try {
      addLog(`🎯 분석 대상 파일: s3://crewbe-video-uploads/${s3Key}`);
      addLog('🚀 AWS 분석 서비스들 초기화 중...');
      addLog('   • Amazon Transcribe (음성-텍스트 변환)');
      addLog('   • Amazon Rekognition (얼굴 감지)');
      addLog('   • Amazon Rekognition (감정 분석)');
      
      // 분석 작업들 시작
      const jobs = await startAnalysis(s3Key, addLog);
      
      addLog('⏳ 분석 작업 완료 대기 중...');
      addLog('🔄 5초 간격으로 상태 확인 시작');
      
      // 폴링으로 결과 대기
      const results = await pollAnalysisResults(jobs, addLog);
      
      addLog('🎉 모든 분석 작업 완료!');
      addLog('📊 분석 결과 요약:');
      if (results.sttJsonUrl) {
        addLog(`   • STT 결과: ${results.sttJsonUrl}`);
      }
      if (results.faceDetections) {
        addLog(`   • 얼굴 감지: ${Array.isArray(results.faceDetections) ? results.faceDetections.length : 0}개 감지`);
      }
      if (results.segmentDetections) {
        addLog(`   • 감정 분석: ${Array.isArray(results.segmentDetections) ? results.segmentDetections.length : 0}개 세그먼트`);
      }
      addLog('🏆 AWS AI 분석 프로세스 완료');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '분석 실패';
      addLog(`💥 분석 실패: ${errorMessage}`);
      
      if (error instanceof Error) {
        addLog(`🔍 에러 세부사항: ${error.stack || 'No stack trace'}`);
      }
      
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
      addLog('🏁 분석 프로세스 종료');
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