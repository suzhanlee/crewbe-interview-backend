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

    logCallback(`🎤 STT 작업 시작: ${jobName}`);

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

    await transcribeService.startTranscriptionJob(params).promise();
    logCallback(`✅ STT 작업 요청 완료: ${jobName}`);
    
    return jobName;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    logCallback(`❌ STT 작업 시작 실패: ${errorMessage}`);
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

    logCallback(`👤 Face Detection 작업 시작`);

    const params = {
      Video: video,
      FaceAttributes: 'ALL',
      NotificationChannel: undefined, // 폴링 방식 사용
    };

    const response = await rekognitionService.startFaceDetection(params).promise();
    const jobId = response.JobId!;
    
    logCallback(`✅ Face Detection 작업 요청 완료: ${jobId}`);
    
    return jobId;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    logCallback(`❌ Face Detection 작업 시작 실패: ${errorMessage}`);
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

    logCallback(`🎭 Segment Detection 작업 시작`);

    const params = {
      Video: video,
      SegmentTypes: ANALYSIS_CONFIG.SEGMENT_TYPES,
      NotificationChannel: undefined, // 폴링 방식 사용
    };

    const response = await rekognitionService.startSegmentDetection(params).promise();
    const jobId = response.JobId!;
    
    logCallback(`✅ Segment Detection 작업 요청 완료: ${jobId}`);
    
    return jobId;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    logCallback(`❌ Segment Detection 작업 시작 실패: ${errorMessage}`);
    throw error;
  }
};

// STT 작업 상태 확인
export const checkTranscriptionJobStatus = async (jobName: string) => {
  try {
    const response = await transcribeService.getTranscriptionJob({
      TranscriptionJobName: jobName,
    }).promise();
    
    return {
      status: response.TranscriptionJob?.TranscriptionJobStatus,
      outputUri: response.TranscriptionJob?.Transcript?.TranscriptFileUri,
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
  logCallback(`🚀 분석 작업들을 시작합니다... (S3 Key: ${s3Key})`);
  
  try {
    // 병렬로 모든 작업 시작
    const [transcriptionJobName, faceDetectionJobId, segmentDetectionJobId] = await Promise.all([
      startTranscriptionJob(s3Key, logCallback),
      startFaceDetection(s3Key, logCallback),
      startSegmentDetection(s3Key, logCallback),
    ]);
    
    logCallback(`🎯 모든 분석 작업 시작 완료!`);
    logCallback(`📝 STT Job: ${transcriptionJobName}`);
    logCallback(`👤 Face Job: ${faceDetectionJobId}`);
    logCallback(`🎭 Segment Job: ${segmentDetectionJobId}`);
    
    return {
      transcriptionJobName,
      faceDetectionJobId,
      segmentDetectionJobId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    logCallback(`❌ 분석 작업 시작 실패: ${errorMessage}`);
    throw error;
  }
};

// 분석 작업 완료 폴링
export const pollAnalysisResults = async (
  jobs: AnalysisJobs,
  logCallback: (message: string) => void
): Promise<AnalysisResults> => {
  logCallback(`⏳ 분석 결과 폴링 시작... (5초 간격)`);
  
  return new Promise((resolve, reject) => {
    const pollInterval = setInterval(async () => {
      try {
        logCallback(`🔄 분석 상태 확인 중...`);
        
        // 모든 작업 상태 확인
        const [sttStatus, faceStatus, segmentStatus] = await Promise.all([
          checkTranscriptionJobStatus(jobs.transcriptionJobName),
          checkFaceDetectionStatus(jobs.faceDetectionJobId),
          checkSegmentDetectionStatus(jobs.segmentDetectionJobId),
        ]);
        
        logCallback(`📊 STT: ${sttStatus.status}, Face: ${faceStatus.status}, Segment: ${segmentStatus.status}`);
        
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
          
          logCallback(`STT JSON: ${sttStatus.outputUri}`);
          logCallback(`Face detections: ${faceStatus.faces?.length || 0} faces found`);
          logCallback(`🎉 Analysis Done`);
          
          resolve({
            sttJsonUrl: sttStatus.outputUri,
            faceDetections: faceStatus.faces,
            segmentDetections: segmentStatus.segments,
          });
        } else if (anyFailed) {
          clearInterval(pollInterval);
          const errorMsg = `분석 작업 실패 - STT: ${sttStatus.status}, Face: ${faceStatus.status}, Segment: ${segmentStatus.status}`;
          logCallback(`❌ ${errorMsg}`);
          reject(new Error(errorMsg));
        }
        // 계속 폴링...
        
      } catch (error) {
        clearInterval(pollInterval);
        const errorMessage = error instanceof Error ? error.message : '폴링 중 오류 발생';
        logCallback(`❌ 폴링 오류: ${errorMessage}`);
        reject(error);
      }
    }, ANALYSIS_CONFIG.POLLING_INTERVAL);
  });
}; 