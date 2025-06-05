const express = require('express');
const AWS = require('aws-sdk');

// 새로운 로깅 시스템 임포트
const { logger, apiLogger } = require('../utils/logger');

// AWS 설정
const transcribe = new AWS.TranscribeService();
const rekognition = new AWS.Rekognition();
const s3 = new AWS.S3();

const router = express.Router();

// 면접 분석 시작 엔드포인트
router.post('/start', async (req, res) => {
  const startTime = Date.now();
  try {
    const { s3Key, bucket } = req.body;
    
    if (!s3Key) {
      logger.warn('🧠 분석 시작 실패 - S3 키 누락', {
        requestId: req.requestId
      });
      
      return res.status(400).json({
        success: false,
        error: 'S3 키가 필요합니다',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }

    const bucketName = bucket || process.env.AWS_S3_RECORDING_BUCKET || 'flight-attendant-recordings';
    const analysisTypes = ['STT', 'FaceDetection', 'SegmentDetection'];
    
    // 분석 시작 로깅
    apiLogger.analysis.start(s3Key, analysisTypes, req.requestId);
    
    const analysisResults = {};

    // 1. STT (Speech-to-Text) 작업 시작
    try {
      const sttJobName = `interview-stt-${Date.now()}`;
      
      logger.info('🎤 STT 작업 시작 시도', {
        requestId: req.requestId,
        jobName: sttJobName,
        s3Key,
        bucket: bucketName
      });

      const transcribeParams = {
        TranscriptionJobName: sttJobName,
        Media: {
          MediaFileUri: `s3://${bucketName}/${s3Key}`
        },
        MediaFormat: 'webm',
        LanguageCode: 'ko-KR',
        OutputBucketName: 'crewbe-analysis-results',
      };

      // AWS Transcribe 호출 로깅
      apiLogger.aws.start('Transcribe', 'startTranscriptionJob', transcribeParams, req.requestId);
      
      const awsStartTime = Date.now();
      const sttResult = await transcribe.startTranscriptionJob(transcribeParams).promise();
      const awsDuration = Date.now() - awsStartTime;
      
      analysisResults.stt = {
        jobId: sttJobName,
        status: 'IN_PROGRESS',
        jobName: sttResult.TranscriptionJob.TranscriptionJobName
      };
      
      // AWS 성공 로깅
      apiLogger.aws.success('Transcribe', 'startTranscriptionJob', {
        jobName: sttResult.TranscriptionJob.TranscriptionJobName,
        status: sttResult.TranscriptionJob.TranscriptionJobStatus
      }, req.requestId, awsDuration);
      
      // 분석 작업 생성 로깅
      apiLogger.analysis.jobCreated('STT', sttJobName, req.requestId);
      
    } catch (sttError) {
      logger.error('💥 STT 작업 시작 실패', {
        requestId: req.requestId,
        error: sttError.message,
        code: sttError.code,
        stack: sttError.stack
      });
      
      apiLogger.analysis.failed('STT', 'N/A', sttError, req.requestId);
      
      analysisResults.stt = {
        status: 'FAILED',
        error: sttError.message
      };
    }

    // 2. 얼굴 감지 작업 시작
    try {
      logger.info('👤 얼굴 감지 작업 시작 시도', {
        requestId: req.requestId,
        s3Key,
        bucket: bucketName
      });

      const faceDetectionParams = {
        Video: {
          S3Object: {
            Bucket: bucketName,
            Name: s3Key
          }
        },
        FaceAttributes: 'ALL'
      };

      // AWS Rekognition 호출 로깅
      apiLogger.aws.start('Rekognition', 'startFaceDetection', faceDetectionParams, req.requestId);
      
      const awsStartTime = Date.now();
      const faceResult = await rekognition.startFaceDetection(faceDetectionParams).promise();
      const awsDuration = Date.now() - awsStartTime;
      
      analysisResults.faceDetection = {
        jobId: faceResult.JobId,
        status: 'IN_PROGRESS'
      };
      
      // AWS 성공 로깅
      apiLogger.aws.success('Rekognition', 'startFaceDetection', {
        jobId: faceResult.JobId
      }, req.requestId, awsDuration);
      
      // 분석 작업 생성 로깅
      apiLogger.analysis.jobCreated('FaceDetection', faceResult.JobId, req.requestId);
      
    } catch (faceError) {
      logger.error('💥 얼굴 감지 작업 시작 실패', {
        requestId: req.requestId,
        error: faceError.message,
        code: faceError.code,
        stack: faceError.stack
      });
      
      apiLogger.analysis.failed('FaceDetection', 'N/A', faceError, req.requestId);
      
      analysisResults.faceDetection = {
        status: 'FAILED',
        error: faceError.message
      };
    }

    // 3. 감정/세그먼트 분석 작업 시작
    try {
      logger.info('🎬 세그먼트 감지 작업 시작 시도', {
        requestId: req.requestId,
        s3Key,
        bucket: bucketName
      });

      const segmentDetectionParams = {
        Video: {
          S3Object: {
            Bucket: bucketName,
            Name: s3Key
          }
        },
        SegmentTypes: ['TECHNICAL_CUE', 'SHOT']
      };

      // AWS Rekognition 호출 로깅
      apiLogger.aws.start('Rekognition', 'startSegmentDetection', segmentDetectionParams, req.requestId);
      
      const awsStartTime = Date.now();
      const segmentResult = await rekognition.startSegmentDetection(segmentDetectionParams).promise();
      const awsDuration = Date.now() - awsStartTime;
      
      analysisResults.segmentDetection = {
        jobId: segmentResult.JobId,
        status: 'IN_PROGRESS'
      };
      
      // AWS 성공 로깅
      apiLogger.aws.success('Rekognition', 'startSegmentDetection', {
        jobId: segmentResult.JobId
      }, req.requestId, awsDuration);
      
      // 분석 작업 생성 로깅
      apiLogger.analysis.jobCreated('SegmentDetection', segmentResult.JobId, req.requestId);
      
    } catch (emotionError) {
      logger.error('💥 세그먼트 감지 작업 시작 실패', {
        requestId: req.requestId,
        error: emotionError.message,
        code: emotionError.code,
        stack: emotionError.stack
      });
      
      apiLogger.analysis.failed('SegmentDetection', 'N/A', emotionError, req.requestId);
      
      analysisResults.segmentDetection = {
        status: 'FAILED',
        error: emotionError.message
      };
    }

    const totalDuration = Date.now() - startTime;
    
    logger.info('🎉 모든 분석 작업 시작 완료', {
      requestId: req.requestId,
      s3Key,
      bucket: bucketName,
      successfulJobs: Object.keys(analysisResults).filter(key => 
        analysisResults[key].status === 'IN_PROGRESS'
      ).length,
      totalJobs: Object.keys(analysisResults).length,
      totalDuration: `${totalDuration}ms`
    });

    res.json({
      success: true,
      message: '면접 분석 작업들이 시작되었습니다',
      s3Key: s3Key,
      bucket: bucketName,
      analysisJobs: analysisResults,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('💥 분석 시작 전체 실패', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    
    res.status(500).json({
      success: false,
      error: '분석 시작 실패',
      message: error.message,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }
});

// 분석 상태 확인 엔드포인트
router.get('/status/:jobType/:jobId', async (req, res) => {
  const startTime = Date.now();
  try {
    const { jobType, jobId } = req.params;
    
    // 상태 확인 시작 로깅
    apiLogger.analysis.statusCheck(jobType, jobId, 'CHECKING', req.requestId);

    let result;
    let status;

    switch (jobType.toLowerCase()) {
      case 'stt':
        // AWS Transcribe 상태 확인 로깅
        apiLogger.aws.start('Transcribe', 'getTranscriptionJob', { TranscriptionJobName: jobId }, req.requestId);
        
        const awsStartTime1 = Date.now();
        result = await transcribe.getTranscriptionJob({ TranscriptionJobName: jobId }).promise();
        const awsDuration1 = Date.now() - awsStartTime1;
        
        status = {
          jobId: jobId,
          status: result.TranscriptionJob.TranscriptionJobStatus,
          creationTime: result.TranscriptionJob.CreationTime,
          completionTime: result.TranscriptionJob.CompletionTime,
        };
        
        if (result.TranscriptionJob.TranscriptionJobStatus === 'COMPLETED') {
          status.transcript = result.TranscriptionJob.Transcript;
          // 완료 로깅
          apiLogger.analysis.completed('STT', jobId, awsDuration1, req.requestId);
        }
        
        // AWS 성공 로깅
        apiLogger.aws.success('Transcribe', 'getTranscriptionJob', {
          status: result.TranscriptionJob.TranscriptionJobStatus
        }, req.requestId, awsDuration1);
        
        break;

      case 'face':
        // AWS Rekognition 얼굴 감지 상태 확인 로깅
        apiLogger.aws.start('Rekognition', 'getFaceDetection', { JobId: jobId }, req.requestId);
        
        const awsStartTime2 = Date.now();
        result = await rekognition.getFaceDetection({ JobId: jobId }).promise();
        const awsDuration2 = Date.now() - awsStartTime2;
        
        status = {
          jobId: jobId,
          status: result.JobStatus,
          videoMetadata: result.VideoMetadata,
          faceDetections: result.Faces ? result.Faces.slice(0, 5) : [] // 처음 5개만
        };
        
        if (result.JobStatus === 'SUCCEEDED') {
          // 완료 로깅
          apiLogger.analysis.completed('FaceDetection', jobId, awsDuration2, req.requestId);
        }
        
        // AWS 성공 로깅
        apiLogger.aws.success('Rekognition', 'getFaceDetection', {
          status: result.JobStatus,
          faceCount: result.Faces ? result.Faces.length : 0
        }, req.requestId, awsDuration2);
        
        break;

      case 'segment':
        // AWS Rekognition 세그먼트 감지 상태 확인 로깅
        apiLogger.aws.start('Rekognition', 'getSegmentDetection', { JobId: jobId }, req.requestId);
        
        const awsStartTime3 = Date.now();
        result = await rekognition.getSegmentDetection({ JobId: jobId }).promise();
        const awsDuration3 = Date.now() - awsStartTime3;
        
        status = {
          jobId: jobId,
          status: result.JobStatus,
          videoMetadata: result.VideoMetadata,
          segments: result.Segments ? result.Segments.slice(0, 10) : [] // 처음 10개만
        };
        
        if (result.JobStatus === 'SUCCEEDED') {
          // 완료 로깅
          apiLogger.analysis.completed('SegmentDetection', jobId, awsDuration3, req.requestId);
        }
        
        // AWS 성공 로깅
        apiLogger.aws.success('Rekognition', 'getSegmentDetection', {
          status: result.JobStatus,
          segmentCount: result.Segments ? result.Segments.length : 0
        }, req.requestId, awsDuration3);
        
        break;

      default:
        logger.warn('⚠️ 지원하지 않는 작업 타입', {
          requestId: req.requestId,
          jobType,
          supportedTypes: ['stt', 'face', 'segment']
        });
        
        return res.status(400).json({
          success: false,
          error: '지원하지 않는 작업 타입',
          supportedTypes: ['stt', 'face', 'segment'],
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        });
    }

    const totalDuration = Date.now() - startTime;
    
    logger.info(`✅ ${jobType.toUpperCase()} 상태 확인 완료`, {
      requestId: req.requestId,
      jobId,
      status: status.status,
      totalDuration: `${totalDuration}ms`
    });

    res.json({
      success: true,
      jobType: jobType,
      result: status,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error(`💥 ${req.params.jobType.toUpperCase()} 상태 확인 실패`, {
      requestId: req.requestId,
      jobId: req.params.jobId,
      error: error.message,
      code: error.code,
      duration: `${duration}ms`
    });
    
    // 분석 실패 로깅
    apiLogger.analysis.failed(req.params.jobType, req.params.jobId, error, req.requestId);
    
    res.status(500).json({
      success: false,
      error: '상태 확인 실패',
      message: error.message,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }
});

// 모든 분석 작업 상태 일괄 확인
router.post('/status-all', async (req, res) => {
  try {
    const { jobs } = req.body; // { stt: 'jobName', face: 'jobId', segment: 'jobId' }
    
    console.log('🔍 [ANALYSIS] 모든 작업 상태 일괄 확인');
    
    const results = {};

    // STT 상태 확인
    if (jobs.stt) {
      try {
        const sttResult = await transcribe.getTranscriptionJob({ TranscriptionJobName: jobs.stt }).promise();
        results.stt = {
          status: sttResult.TranscriptionJob.TranscriptionJobStatus,
          creationTime: sttResult.TranscriptionJob.CreationTime,
          completionTime: sttResult.TranscriptionJob.CompletionTime,
        };
        
        if (sttResult.TranscriptionJob.TranscriptionJobStatus === 'COMPLETED') {
          results.stt.transcript = sttResult.TranscriptionJob.Transcript;
        }
        
        console.log('✅ [STT] 상태 확인 완료:', results.stt.status);
      } catch (sttError) {
        console.error('💥 [STT] 상태 확인 실패:', sttError);
        results.stt = { status: 'ERROR', error: sttError.message };
      }
    }

    // Face Detection 상태 확인
    if (jobs.face) {
      try {
        const faceResult = await rekognition.getFaceDetection({ JobId: jobs.face }).promise();
        results.face = {
          status: faceResult.JobStatus,
          faceCount: faceResult.Faces ? faceResult.Faces.length : 0,
        };
        
        console.log('✅ [FACE] 상태 확인 완료:', results.face.status);
      } catch (faceError) {
        console.error('💥 [FACE] 상태 확인 실패:', faceError);
        results.face = { status: 'ERROR', error: faceError.message };
      }
    }

    // Segment Detection 상태 확인
    if (jobs.segment) {
      try {
        const segmentResult = await rekognition.getSegmentDetection({ JobId: jobs.segment }).promise();
        results.segment = {
          status: segmentResult.JobStatus,
          segmentCount: segmentResult.Segments ? segmentResult.Segments.length : 0,
        };
        
        console.log('✅ [SEGMENT] 상태 확인 완료:', results.segment.status);
      } catch (segmentError) {
        console.error('💥 [SEGMENT] 상태 확인 실패:', segmentError);
        results.segment = { status: 'ERROR', error: segmentError.message };
      }
    }

    res.json({
      success: true,
      results: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 [ANALYSIS] 일괄 상태 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: '일괄 상태 확인 실패',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 분석 결과 요약 생성
router.post('/summary', async (req, res) => {
  try {
    const { jobs } = req.body;
    
    console.log('📊 [SUMMARY] 분석 결과 요약 생성');
    
    // 여기서 실제로는 모든 분석 결과를 종합하여 
    // 면접자에 대한 종합 피드백을 생성할 수 있습니다
    const summary = {
      overall_score: Math.floor(Math.random() * 30) + 70, // 70-100점 랜덤
      speech_analysis: {
        clarity: Math.floor(Math.random() * 20) + 80,
        pace: Math.floor(Math.random() * 15) + 75,
        volume: Math.floor(Math.random() * 25) + 75
      },
      facial_analysis: {
        confidence: Math.floor(Math.random() * 20) + 80,
        engagement: Math.floor(Math.random() * 15) + 85,
        expressiveness: Math.floor(Math.random() * 25) + 75
      },
      recommendations: [
        "더 자신감 있는 목소리로 답변해보세요",
        "시선 처리가 자연스럽습니다",
        "답변 구조를 더 체계적으로 구성해보세요"
      ]
    };

    console.log('✅ [SUMMARY] 요약 생성 완료:', summary.overall_score, '점');

    res.json({
      success: true,
      summary: summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 [SUMMARY] 요약 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: '요약 생성 실패',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 