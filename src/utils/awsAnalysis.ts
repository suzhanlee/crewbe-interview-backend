import { v4 as uuidv4 } from 'uuid';
import { 
  transcribeService, 
  rekognitionService, 
  BUCKETS, 
  ANALYSIS_CONFIG 
} from '../config/aws.config';

export interface AnalysisJobs {
  transcriptionJobName: string;
  faceDetectionJobId: string;
  segmentDetectionJobId: string;
}

export interface AnalysisResults {
  sttJsonUrl?: string;
  faceDetections?: any;
  segmentDetections?: any;
  error?: string;
}

// STT 작업 시작
export const startTranscriptionJob = async (
  s3Key: string,
  logCallback: (message: string) => void
): Promise<string> => {
  try {
    const jobName = `transcription-${uuidv4()}`;
    const mediaUri = `s3://${BUCKETS.VIDEO}/${s3Key}`;
    const outputS3Uri = `s3://${BUCKETS.ANALYSIS}/transcriptions/`;

    logCallback(`🎤 ==============================`);
    logCallback(`🎤 Amazon Transcribe STT 시작`);
    logCallback(`🎤 ==============================`);
    logCallback(`📝 작업 이름: ${jobName}`);
    logCallback(`📂 입력 파일: ${mediaUri}`);
    logCallback(`📁 출력 경로: ${outputS3Uri}`);
    logCallback(`🗣️  언어 설정: ko-KR (한국어)`);
    logCallback(`👥 화자 구분: 활성화 (최대 2명)`);

    const params = {
      TranscriptionJobName: jobName,
      Media: {
        MediaFileUri: mediaUri,
      },
      MediaFormat: 'webm',
      LanguageCode: 'ko-KR',
      OutputBucketName: BUCKETS.ANALYSIS,
      OutputKey: `transcriptions/${jobName}.json`,
      Settings: {
        ShowSpeakerLabels: true,
        MaxSpeakerLabels: 2,
      },
    };

    logCallback(`🔧 Transcribe 매개변수 구성:`);
    logCallback(`   • 미디어 형식: ${params.MediaFormat}`);
    logCallback(`   • 출력 버킷: ${params.OutputBucketName}`);
    logCallback(`   • 출력 키: ${params.OutputKey}`);
    logCallback(`   • 화자 라벨링: ${params.Settings?.ShowSpeakerLabels ? '활성화' : '비활성화'}`);
    
    logCallback(`🚀 AWS Transcribe API 호출 중...`);
    await transcribeService.startTranscriptionJob(params).promise();
    
    logCallback(`✅ STT 작업 요청 완료: ${jobName}`);
    logCallback(`⏳ 작업 처리 시작됨 (완료까지 수 분 소요)`);
    logCallback(`📊 예상 출력: ${outputS3Uri}${jobName}.json`);
    
    return jobName;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    logCallback(`💥 STT 작업 시작 실패: ${errorMessage}`);
    
    if (error instanceof Error) {
      logCallback(`🔍 에러 코드: ${(error as any).code || 'Unknown'}`);
      logCallback(`🔍 에러 상태: ${(error as any).statusCode || 'Unknown'}`);
      logCallback(`🔍 에러 스택: ${error.stack?.substring(0, 200) || 'No stack'}`);
    }
    
    throw error;
  }
};

// Face Detection 작업 시작
export const startFaceDetection = async (
  s3Key: string,
  logCallback: (message: string) => void
): Promise<string> => {
  try {
    const video = {
      S3Object: {
        Bucket: BUCKETS.VIDEO,
        Name: s3Key,
      },
    };

    logCallback(`👤 ===============================`);
    logCallback(`👤 Amazon Rekognition 얼굴 감지 시작`);
    logCallback(`👤 ===============================`);
    logCallback(`📂 입력 버킷: ${BUCKETS.VIDEO}`);
    logCallback(`📁 입력 파일: ${s3Key}`);
    logCallback(`🎯 감지 대상: 얼굴, 나이, 성별, 감정, 포즈`);
    logCallback(`⚙️  얼굴 속성: ALL (모든 속성 분석)`);

    const params = {
      Video: video,
      FaceAttributes: 'ALL',
      NotificationChannel: undefined, // 폴링 방식 사용
    };

    logCallback(`🔧 Rekognition 매개변수 구성:`);
    logCallback(`   • 비디오 소스: S3`);
    logCallback(`   • 얼굴 속성: ${params.FaceAttributes}`);
    logCallback(`   • 알림 방식: 폴링 (NotificationChannel 없음)`);
    
    logCallback(`🚀 AWS Rekognition FaceDetection API 호출 중...`);
    const response = await rekognitionService.startFaceDetection(params).promise();
    const jobId = response.JobId!;
    
    logCallback(`✅ Face Detection 작업 요청 완료`);
    logCallback(`🆔 작업 ID: ${jobId}`);
    logCallback(`⏳ 비디오 분석 시작됨 (프레임별 얼굴 감지)`);
    logCallback(`📊 분석 내용: 얼굴 경계상자, 감정, 나이, 성별 등`);
    
    return jobId;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    logCallback(`💥 Face Detection 작업 시작 실패: ${errorMessage}`);
    
    if (error instanceof Error) {
      logCallback(`🔍 에러 코드: ${(error as any).code || 'Unknown'}`);
      logCallback(`🔍 에러 상태: ${(error as any).statusCode || 'Unknown'}`);
    }
    
    throw error;
  }
};

// Segment Detection 작업 시작 (emotion 포함)
export const startSegmentDetection = async (
  s3Key: string,
  logCallback: (message: string) => void
): Promise<string> => {
  try {
    const video = {
      S3Object: {
        Bucket: BUCKETS.VIDEO,
        Name: s3Key,
      },
    };

    logCallback(`🎭 ==================================`);
    logCallback(`🎭 Amazon Rekognition 세그먼트 감지 시작`);
    logCallback(`🎭 ==================================`);
    logCallback(`📂 입력 버킷: ${BUCKETS.VIDEO}`);
    logCallback(`📁 입력 파일: ${s3Key}`);
    logCallback(`🎬 분석 유형: ${ANALYSIS_CONFIG.SEGMENT_TYPES.join(', ')}`);
    logCallback(`📹 기술적 단서: 장면 전환, 샷 변경 감지`);

    const params = {
      Video: video,
      SegmentTypes: ANALYSIS_CONFIG.SEGMENT_TYPES,
      NotificationChannel: undefined, // 폴링 방식 사용
    };

    logCallback(`🔧 Rekognition 매개변수 구성:`);
    logCallback(`   • 비디오 소스: S3`);
    logCallback(`   • 세그먼트 유형: [${params.SegmentTypes.join(', ')}]`);
    logCallback(`   • 알림 방식: 폴링`);
    
    logCallback(`🚀 AWS Rekognition SegmentDetection API 호출 중...`);
    const response = await rekognitionService.startSegmentDetection(params).promise();
    const jobId = response.JobId!;
    
    logCallback(`✅ Segment Detection 작업 요청 완료`);
    logCallback(`🆔 작업 ID: ${jobId}`);
    logCallback(`⏳ 비디오 세그먼트 분석 시작됨`);
    logCallback(`📊 분석 내용: 장면 변화, 샷 경계, 기술적 단서`);
    
    return jobId;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    logCallback(`💥 Segment Detection 작업 시작 실패: ${errorMessage}`);
    
    if (error instanceof Error) {
      logCallback(`🔍 에러 코드: ${(error as any).code || 'Unknown'}`);
      logCallback(`🔍 에러 상태: ${(error as any).statusCode || 'Unknown'}`);
    }
    
    throw error;
  }
};

// STT 작업 상태 확인
export const checkTranscriptionJobStatus = async (jobName: string) => {
  try {
    const response = await transcribeService.getTranscriptionJob({
      TranscriptionJobName: jobName,
    }).promise();
    
    const job = response.TranscriptionJob;
    const status = job?.TranscriptionJobStatus;
    const outputUri = job?.Transcript?.TranscriptFileUri;
    
    return {
      status,
      outputUri,
      creationTime: job?.CreationTime,
      completionTime: job?.CompletionTime,
      languageCode: job?.LanguageCode,
      mediaFormat: job?.MediaFormat,
    };
  } catch (error) {
    throw error;
  }
};

// Face Detection 작업 상태 확인
export const checkFaceDetectionStatus = async (jobId: string) => {
  try {
    const response = await rekognitionService.getFaceDetection({
      JobId: jobId,
    }).promise();
    
    return {
      status: response.JobStatus,
      faces: response.Faces,
      videoMetadata: response.VideoMetadata,
      statusMessage: response.StatusMessage,
    };
  } catch (error) {
    throw error;
  }
};

// Segment Detection 작업 상태 확인
export const checkSegmentDetectionStatus = async (jobId: string) => {
  try {
    const response = await rekognitionService.getSegmentDetection({
      JobId: jobId,
    }).promise();
    
    return {
      status: response.JobStatus,
      segments: response.Segments,
      videoMetadata: response.VideoMetadata,
      statusMessage: response.StatusMessage,
    };
  } catch (error) {
    throw error;
  }
};

// 모든 분석 작업 시작
export const startAnalysis = async (
  s3Key: string,
  logCallback: (message: string) => void
): Promise<AnalysisJobs> => {
  logCallback(`🚀 ===================================`);
  logCallback(`🚀 AWS AI 분석 작업 일괄 시작`);
  logCallback(`🚀 ===================================`);
  logCallback(`📁 분석 대상: s3://${BUCKETS.VIDEO}/${s3Key}`);
  logCallback(`🎯 예정 작업: STT + 얼굴감지 + 세그먼트분석`);
  logCallback(`⚡ 병렬 처리: 3개 서비스 동시 시작`);
  
  try {
    // 병렬로 모든 작업 시작
    logCallback(`🔄 병렬 작업 시작...`);
    const startTime = Date.now();
    
    const [transcriptionJobName, faceDetectionJobId, segmentDetectionJobId] = await Promise.all([
      startTranscriptionJob(s3Key, logCallback),
      startFaceDetection(s3Key, logCallback),
      startSegmentDetection(s3Key, logCallback),
    ]);
    
    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(2);
    
    logCallback(`🎯 모든 분석 작업 시작 완료!`);
    logCallback(`⏱️  총 소요 시간: ${totalTime}초`);
    logCallback(`📋 작업 요약:`);
    logCallback(`   📝 STT Job: ${transcriptionJobName}`);
    logCallback(`   👤 Face Job: ${faceDetectionJobId}`);
    logCallback(`   🎭 Segment Job: ${segmentDetectionJobId}`);
    logCallback(`⏳ 이제 주기적으로 완료 상태를 확인합니다...`);
    
    return {
      transcriptionJobName,
      faceDetectionJobId,
      segmentDetectionJobId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    logCallback(`💥 분석 작업 시작 실패: ${errorMessage}`);
    
    if (error instanceof Error) {
      logCallback(`🔍 에러 세부사항: ${error.stack?.substring(0, 300) || 'No stack'}`);
    }
    
    throw error;
  }
};

// 분석 작업 완료 폴링
export const pollAnalysisResults = async (
  jobs: AnalysisJobs,
  logCallback: (message: string) => void
): Promise<AnalysisResults> => {
  logCallback(`⏳ =============================`);
  logCallback(`⏳ 분석 결과 폴링 시작`);
  logCallback(`⏳ =============================`);
  logCallback(`🔄 폴링 간격: ${ANALYSIS_CONFIG.POLLING_INTERVAL / 1000}초`);
  logCallback(`📋 모니터링 작업:`);
  logCallback(`   📝 STT: ${jobs.transcriptionJobName}`);
  logCallback(`   👤 Face: ${jobs.faceDetectionJobId}`);
  logCallback(`   🎭 Segment: ${jobs.segmentDetectionJobId}`);
  
  let pollCount = 0;
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const pollInterval = setInterval(async () => {
      try {
        pollCount++;
        const elapsedMinutes = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
        
        logCallback(`🔄 상태 확인 #${pollCount} (경과: ${elapsedMinutes}분)`);
        
        // 모든 작업 상태 확인
        const [sttStatus, faceStatus, segmentStatus] = await Promise.all([
          checkTranscriptionJobStatus(jobs.transcriptionJobName),
          checkFaceDetectionStatus(jobs.faceDetectionJobId),
          checkSegmentDetectionStatus(jobs.segmentDetectionJobId),
        ]);
        
        // 상태 로깅
        logCallback(`📊 현재 상태:`);
        logCallback(`   📝 STT: ${sttStatus.status}`);
        logCallback(`   👤 Face: ${faceStatus.status}`);
        logCallback(`   🎭 Segment: ${segmentStatus.status}`);
        
        // 진행 중인 작업들의 세부 정보
        if (sttStatus.status === 'IN_PROGRESS') {
          logCallback(`   📝 STT 처리 중... (언어: ${sttStatus.languageCode}, 형식: ${sttStatus.mediaFormat})`);
        }
        
        if (faceStatus.status === 'IN_PROGRESS' && faceStatus.videoMetadata) {
          const metadata = faceStatus.videoMetadata;
          logCallback(`   👤 Face 분석 중... (${metadata.DurationMillis}ms 비디오)`);
        }
        
        if (segmentStatus.status === 'IN_PROGRESS' && segmentStatus.videoMetadata) {
          const metadata = segmentStatus.videoMetadata;
          logCallback(`   🎭 Segment 분석 중... (${metadata.FrameRate}fps)`);
        }
        
        // 모든 작업이 완료되었는지 확인
        const allCompleted = sttStatus.status === 'COMPLETED' && 
                           faceStatus.status === 'SUCCEEDED' && 
                           segmentStatus.status === 'SUCCEEDED';
        
        // 실패한 작업이 있는지 확인
        const anyFailed = sttStatus.status === 'FAILED' || 
                         faceStatus.status === 'FAILED' || 
                         segmentStatus.status === 'FAILED';
        
        if (allCompleted) {
          clearInterval(pollInterval);
          
          const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
          
          logCallback(`🎉 =============================`);
          logCallback(`🎉 모든 분석 작업 완료!`);
          logCallback(`🎉 =============================`);
          logCallback(`⏱️  총 소요 시간: ${totalTime}분`);
          logCallback(`🔍 총 폴링 횟수: ${pollCount}회`);
          
          // 결과 로깅
          if (sttStatus.outputUri) {
            logCallback(`📝 STT JSON: ${sttStatus.outputUri}`);
            logCallback(`   🕐 STT 완료 시간: ${sttStatus.completionTime}`);
          }
          
          if (faceStatus.faces) {
            const faceCount = Array.isArray(faceStatus.faces) ? faceStatus.faces.length : 0;
            logCallback(`👤 Face detections: ${faceCount} faces found`);
            if (faceCount > 0) {
              logCallback(`   📊 첫 번째 얼굴 정보: ${JSON.stringify(faceStatus.faces[0]).substring(0, 100)}...`);
            }
          }
          
          if (segmentStatus.segments) {
            const segmentCount = Array.isArray(segmentStatus.segments) ? segmentStatus.segments.length : 0;
            logCallback(`🎭 Segments: ${segmentCount} segments found`);
            if (segmentCount > 0) {
              logCallback(`   📊 첫 번째 세그먼트: ${JSON.stringify(segmentStatus.segments[0]).substring(0, 100)}...`);
            }
          }
          
          logCallback(`🏆 Analysis Done`);
          
          resolve({
            sttJsonUrl: sttStatus.outputUri,
            faceDetections: faceStatus.faces,
            segmentDetections: segmentStatus.segments,
          });
        } else if (anyFailed) {
          clearInterval(pollInterval);
          
          const errorMsg = `분석 작업 실패 - STT: ${sttStatus.status}, Face: ${faceStatus.status}, Segment: ${segmentStatus.status}`;
          logCallback(`💥 ${errorMsg}`);
          
          // 실패 세부사항 로깅
          if (sttStatus.status === 'FAILED') {
            logCallback(`📝 STT 실패 원인: 음성 품질, 지원되지 않는 형식, 또는 권한 문제`);
          }
          if (faceStatus.status === 'FAILED') {
            logCallback(`👤 Face 실패 원인: ${faceStatus.statusMessage || '알 수 없음'}`);
          }
          if (segmentStatus.status === 'FAILED') {
            logCallback(`🎭 Segment 실패 원인: ${segmentStatus.statusMessage || '알 수 없음'}`);
          }
          
          reject(new Error(errorMsg));
        } else {
          // 아직 진행 중
          logCallback(`⏳ 계속 대기 중... (다음 확인: ${ANALYSIS_CONFIG.POLLING_INTERVAL / 1000}초 후)`);
        }
        
      } catch (error) {
        clearInterval(pollInterval);
        const errorMessage = error instanceof Error ? error.message : '폴링 중 오류 발생';
        logCallback(`💥 폴링 오류: ${errorMessage}`);
        
        if (error instanceof Error) {
          logCallback(`🔍 폴링 에러 세부사항: ${error.stack?.substring(0, 200) || 'No stack'}`);
        }
        
        reject(error);
      }
    }, ANALYSIS_CONFIG.POLLING_INTERVAL);
  });
}; 