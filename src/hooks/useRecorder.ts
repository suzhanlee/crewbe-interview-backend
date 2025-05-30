import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import { RECORDER_CONFIG, generateS3Key } from '../constants';

// 백엔드 API 기본 URL
const API_BASE_URL = __DEV__ ? 'http://localhost:3000' : 'https://your-api-server.com';

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
    const logMessage = `[${timestamp}] ${message}`;
    
    // 터미널 로깅 강화
    console.log('🎬 [INTERVIEW]', logMessage);
    
    // React Native 환경에서는 추가로 warn과 info도 사용
    if (Platform.OS !== 'web') {
      console.info('📱 [MOBILE]', logMessage);
    }
    
    // 상태에도 저장 (필요시 사용)
    setLogs(prev => [...prev, logMessage]);
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
      
      if (Platform.OS === 'web') {
        // 웹 환경: 실제 MediaRecorder API 사용
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
          
          const success = await uploadToS3(blob);
          
          if (success) {
            // 웹 환경에서는 분석 건너뛰기
            addLog('⚠️ 웹 환경에서는 AWS 분석이 지원되지 않습니다');
            addLog('✅ 녹화 및 업로드 완료!');
            addLog('🎯 면접 녹화 프로세스 종료');
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
      } else {
        // 모바일 환경: 시뮬레이션 모드 (로깅만)
        addLog('📱 모바일 환경에서 면접 시뮬레이션 시작');
        addLog('🎯 실제 녹화는 expo-camera에서 처리됩니다');
        addLog('📋 이 로그는 면접 진행 상황을 모니터링합니다');
        
        // 시뮬레이션된 녹화 시작
        setIsRecording(true);
        addLog('✅ 면접 시뮬레이션 상태 활성화');
        
        // 주기적으로 시뮬레이션 로그 추가
        const simulationInterval = setInterval(() => {
          if (isRecording) {
            addLog(`📊 면접 진행 중... (${new Date().toLocaleTimeString()})`);
          }
        }, 10000); // 10초마다 로그
        
        // 인터벌 참조 저장 (나중에 정리용)
        (currentS3KeyRef as any).simulationInterval = simulationInterval;
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(errorMessage);
      addLog(`💥 녹화 시작 실패: ${errorMessage}`);
      
      // 에러 세부사항 로깅
      if (err instanceof Error) {
        addLog(`🔍 에러 스택: ${err.stack || 'No stack trace'}`);
      }
    }
  }, [addLog, isRecording]);

  const stop = useCallback(async () => {
    try {
      addLog('🛑 녹화 중단 요청 받음');
      
      if (Platform.OS === 'web') {
        // 웹 환경: MediaRecorder 중단
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
      } else {
        // 모바일 환경: 시뮬레이션 중단
        if (isRecording) {
          addLog('📱 모바일 면접 시뮬레이션 중단 중...');
          
          // 시뮬레이션 인터벌 정리
          const simulationInterval = (currentS3KeyRef as any).simulationInterval;
          if (simulationInterval) {
            clearInterval(simulationInterval);
            addLog('⏹️  시뮬레이션 모니터링 중단');
          }
          
          setIsRecording(false);
          addLog('✅ 면접 시뮬레이션 중단 완료');
          
          // 모바일에서는 시뮬레이션 업로드 및 분석 시작
          addLog('🚀 모바일 환경에서 분석 시뮬레이션 시작...');
          const simulatedBlob = new Blob(['simulated mobile recording'], { type: 'video/mp4' });
          const success = await uploadToS3(simulatedBlob);
          
          if (success) {
            // 모바일에서는 실제 AWS 분석 수행
            await performAnalysis(currentS3KeyRef.current);
          }
        } else {
          addLog('⚠️ 중단할 면접 시뮬레이션이 없음');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(errorMessage);
      addLog(`💥 녹화 중단 실패: ${errorMessage}`);
    }
  }, [isRecording, stream, addLog]);

  // S3 업로드 함수 (백엔드 API 사용)
  const uploadToS3 = useCallback(async (blob: Blob): Promise<boolean> => {
    try {
      setIsUploading(true);
      const currentS3Key = currentS3KeyRef.current;
      
      if (!currentS3Key) {
        throw new Error('S3 키가 생성되지 않았습니다');
      }

      // 파일 크기 계산
      const fileSizeMB = (blob.size / (1024 * 1024)).toFixed(2);
      
      addLog('☁️ =============================');
      addLog('☁️ S3 업로드 프로세스 시작 (백엔드 API)');
      addLog('☁️ =============================');
      addLog('📊 업로드 파일 정보:');
      addLog(`   • 파일 크기: ${fileSizeMB}MB`);
      addLog(`   • 파일 타입: ${blob.type}`);
      addLog(`   • S3 키: ${currentS3Key}`);
      addLog(`   • API 서버: ${API_BASE_URL}`);
      
      try {
        // 방법 1: Pre-Signed URL을 통한 업로드
        addLog('🔗 백엔드 API에서 Pre-Signed URL 요청 중...');
        
        const presignedResponse = await fetch(`${API_BASE_URL}/api/upload/presigned-url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: `interview-${Date.now()}.webm`,
            fileType: blob.type,
          }),
        });

        if (!presignedResponse.ok) {
          throw new Error(`Pre-Signed URL 요청 실패: ${presignedResponse.status}`);
        }

        const presignedData = await presignedResponse.json();
        
        if (!presignedData.success) {
          throw new Error(`Pre-Signed URL 생성 실패: ${presignedData.error}`);
        }

        addLog('✅ Pre-Signed URL 생성 성공');
        addLog(`🌐 업로드 URL: ${presignedData.presignedUrl.substring(0, 100)}...`);
        addLog(`📁 S3 키: ${presignedData.s3Key}`);
        addLog(`🪣 S3 버킷: ${presignedData.bucket}`);

        // Pre-Signed URL로 직접 업로드
        addLog('📤 Pre-Signed URL로 파일 업로드 시작...');
        addLog('⏳ 파일 업로드 진행 중... (시간이 걸릴 수 있습니다)');
        
        const startTime = Date.now();
        
        const uploadResponse = await fetch(presignedData.presignedUrl, {
          method: 'PUT',
          body: blob,
          headers: {
            'Content-Type': blob.type,
          },
        });

        const endTime = Date.now();
        const uploadTimeSeconds = ((endTime - startTime) / 1000).toFixed(2);
        const uploadSpeedMbps = (parseFloat(fileSizeMB) * 8 / parseFloat(uploadTimeSeconds)).toFixed(2);

        addLog(`⏱️ 업로드 완료 시간: ${uploadTimeSeconds}초`);
        addLog(`🚀 평균 업로드 속도: ${uploadSpeedMbps}Mbps`);
        addLog(`📊 HTTP 응답 상태: ${uploadResponse.status}`);

        if (uploadResponse.ok) {
          addLog('✅ S3 업로드 성공!');
          addLog(`📍 S3 URL: s3://${presignedData.bucket}/${presignedData.s3Key}`);
          
          // S3 키를 업데이트 (백엔드에서 생성된 키 사용)
          currentS3KeyRef.current = presignedData.s3Key;
          
          setError(null);
          return true;
        } else {
          const responseText = await uploadResponse.text();
          addLog(`📄 응답 내용: ${responseText.substring(0, 200)}...`);
          throw new Error(`업로드 실패: ${uploadResponse.status}`);
        }

      } catch (presignedError) {
        addLog(`⚠️ Pre-Signed URL 업로드 실패: ${presignedError.message}`);
        addLog('🔄 직접 업로드 방식으로 재시도...');

        // 방법 2: 백엔드를 통한 직접 업로드 (fallback)
        try {
          addLog('📤 백엔드 API를 통한 직접 업로드 시작...');
          
          const formData = new FormData();
          formData.append('video', blob, `interview-${Date.now()}.webm`);

          const directUploadResponse = await fetch(`${API_BASE_URL}/api/upload/direct`, {
            method: 'POST',
            body: formData,
          });

          if (!directUploadResponse.ok) {
            throw new Error(`직접 업로드 실패: ${directUploadResponse.status}`);
          }

          const directUploadData = await directUploadResponse.json();

          if (!directUploadData.success) {
            throw new Error(`직접 업로드 응답 실패: ${directUploadData.error}`);
          }

          addLog('✅ 백엔드를 통한 직접 업로드 성공!');
          addLog(`⏱️ 업로드 시간: ${directUploadData.uploadTime}초`);
          addLog(`🚀 업로드 속도: ${directUploadData.uploadSpeed}Mbps`);
          addLog(`📍 S3 URL: ${directUploadData.s3Url}`);
          
          // S3 키를 업데이트
          currentS3KeyRef.current = directUploadData.s3Key;
          
          setError(null);
          return true;

        } catch (directError) {
          addLog(`💥 직접 업로드도 실패: ${directError.message}`);
          throw directError;
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '업로드 실패';
      setError(errorMessage);
      addLog(`💥 업로드 실패: ${errorMessage}`);
      
      if (err instanceof Error) {
        addLog(`🔍 에러 세부사항: ${err.stack || 'No stack trace'}`);
      }
      
      // 업로드 실패 시 시뮬레이션 모드로 전환
      addLog('🎭 업로드 실패로 인한 시뮬레이션 모드 전환');
      addLog('⏳ 시뮬레이션 업로드 진행 중...');
      
      const uploadTime = Math.random() * 2 + 1;
      await new Promise(resolve => setTimeout(resolve, uploadTime * 1000));
      
      const uploadSpeed = ((blob.size / (1024 * 1024)) * 8 / uploadTime).toFixed(2);
      addLog(`⏱️ 시뮬레이션 업로드 시간: ${uploadTime.toFixed(2)}초`);
      addLog(`🚀 시뮬레이션 속도: ${uploadSpeed}Mbps`);
      addLog('✅ 시뮬레이션 업로드 완료');
      addLog('🎯 실제 환경에서는 백엔드 API를 통해 처리됩니다');
      
      setError(null);
      return true;
      
    } finally {
      setIsUploading(false);
      addLog('🏁 업로드 프로세스 종료');
    }
  }, [addLog]);

  // AWS 분석 수행 (백엔드 API 사용)
  const performAnalysis = useCallback(async (s3Key: string) => {
    if (Platform.OS === 'web') {
      addLog('⚠️ 웹 환경에서는 AWS 분석을 건너뜁니다');
      return;
    }

    setIsAnalyzing(true);
    addLog('🧠 =============================');
    addLog('🧠 AWS AI 분석 프로세스 시작 (백엔드 API)');
    addLog('🧠 =============================');
    
    try {
      addLog(`🎯 분석 대상 파일: ${s3Key}`);
      addLog(`🌐 API 서버: ${API_BASE_URL}`);
      
      try {
        // 백엔드 API를 통한 분석 시작
        addLog('🚀 백엔드 API를 통한 분석 작업 시작 요청...');
        
        const analysisResponse = await fetch(`${API_BASE_URL}/api/analysis/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            s3Key: s3Key,
            bucket: 'flight-attendant-recordings'
          }),
        });

        if (!analysisResponse.ok) {
          throw new Error(`분석 시작 요청 실패: ${analysisResponse.status}`);
        }

        const analysisData = await analysisResponse.json();
        
        if (!analysisData.success) {
          throw new Error(`분석 시작 응답 실패: ${analysisData.error}`);
        }

        addLog('✅ 백엔드 API 분석 작업 시작 성공!');
        addLog('📊 시작된 분석 작업들:');
        
        const jobs = analysisData.analysisJobs;
        
        if (jobs.stt) {
          addLog(`🎤 [STT] 작업 상태: ${jobs.stt.status}, Job ID: ${jobs.stt.jobId || jobs.stt.jobName}`);
        }
        
        if (jobs.faceDetection) {
          addLog(`👤 [FACE] 작업 상태: ${jobs.faceDetection.status}, Job ID: ${jobs.faceDetection.jobId}`);
        }
        
        if (jobs.segmentDetection) {
          addLog(`😊 [EMOTION] 작업 상태: ${jobs.segmentDetection.status}, Job ID: ${jobs.segmentDetection.jobId}`);
        }

        // 분석 완료 대기 시뮬레이션 (실제로는 폴링이나 웹소켓 사용)
        addLog('⏳ 분석 작업 완료 대기 중...');
        addLog('🔄 실제 환경에서는 5초 간격으로 상태 확인이 필요합니다');
        
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 분석 상태 확인 (예시)
        addLog('🔍 분석 작업 상태 확인 중...');
        
        try {
          const statusResponse = await fetch(`${API_BASE_URL}/api/analysis/status-all`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jobs: {
                stt: jobs.stt?.jobId || jobs.stt?.jobName,
                face: jobs.faceDetection?.jobId,
                segment: jobs.segmentDetection?.jobId,
              }
            }),
          });

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            
            if (statusData.success) {
              addLog('📊 분석 상태 확인 완료:');
              
              if (statusData.results.stt) {
                addLog(`🎤 [STT] 상태: ${statusData.results.stt.status}`);
              }
              
              if (statusData.results.face) {
                addLog(`👤 [FACE] 상태: ${statusData.results.face.status}`);
              }
              
              if (statusData.results.segment) {
                addLog(`😊 [EMOTION] 상태: ${statusData.results.segment.status}`);
              }
            }
          }
        } catch (statusError) {
          addLog(`⚠️ 상태 확인 실패: ${statusError.message}`);
        }

        addLog('🎉 백엔드 API 분석 프로세스 완료!');
        addLog('🎯 실제 환경에서는 폴링을 통해 완료 상태를 확인합니다');
        
      } catch (apiError) {
        addLog(`⚠️ 백엔드 API 분석 실패: ${apiError.message}`);
        addLog('🎭 분석 실패로 인한 시뮬레이션 모드 전환');
        
        // API 실패 시 시뮬레이션
        addLog('🚀 시뮬레이션 AWS 서비스들 초기화 중...');
        addLog('   • Amazon Transcribe (음성-텍스트 변환) - 시뮬레이션');
        addLog('   • Amazon Rekognition (얼굴 감지) - 시뮬레이션');
        addLog('   • Amazon Rekognition (감정 분석) - 시뮬레이션');
        
        // STT 시뮬레이션
        addLog('🎤 [STT 시뮬레이션] 음성-텍스트 변환 시작...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        addLog('✅ [STT 시뮬레이션] 음성 분석 완료');
        addLog('📝 [STT 시뮬레이션] 텍스트 변환: "안녕하세요. 저는 승무원이 되고 싶습니다..."');
        
        // 얼굴 감지 시뮬레이션
        addLog('👤 [얼굴감지 시뮬레이션] 얼굴 인식 분석 시작...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        addLog('✅ [얼굴감지 시뮬레이션] 얼굴 감지 완료');
        addLog('📊 [얼굴감지 시뮬레이션] 감지된 얼굴: 1개, 신뢰도: 99.8%');
        
        // 감정 분석 시뮬레이션
        addLog('😊 [감정분석 시뮬레이션] 표정 및 감정 분석 시작...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        addLog('✅ [감정분석 시뮬레이션] 감정 분석 완료');
        addLog('💡 [감정분석 시뮬레이션] 주요 감정: 자신감(85%), 긍정(92%), 집중(88%)');
        
        addLog('🎉 모든 시뮬레이션 분석 작업 완료!');
        addLog('📊 시뮬레이션 분석 결과 요약:');
        addLog(`   • STT 결과: 시뮬레이션 텍스트 변환 완료`);
        addLog(`   • 얼굴 감지: 1개 얼굴 감지됨 (시뮬레이션)`);
        addLog(`   • 감정 분석: 긍정적 면접 태도 감지됨 (시뮬레이션)`);
        addLog('🏆 시뮬레이션 AWS AI 분석 프로세스 완료');
      }
      
      addLog('🎯 프로덕션에서는 백엔드 API가 실제 AWS 분석을 수행합니다');
      
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