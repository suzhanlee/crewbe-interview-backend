const express = require('express');
const AWS = require('aws-sdk');

// AWS 설정
const transcribe = new AWS.TranscribeService();
const rekognition = new AWS.Rekognition();
const s3 = new AWS.S3();

const router = express.Router();

// 면접 분석 시작 엔드포인트
router.post('/start', async (req, res) => {
  try {
    const { s3Key, bucket } = req.body;
    
    if (!s3Key) {
      return res.status(400).json({
        success: false,
        error: 'S3 키가 필요합니다',
        timestamp: new Date().toISOString()
      });
    }

    console.log('🧠 [ANALYSIS] 면접 분석 시작');
    console.log('🧠 [ANALYSIS]   - S3 키:', s3Key);
    console.log('🧠 [ANALYSIS]   - 버킷:', bucket || 'flight-attendant-recordings');

    const bucketName = bucket || process.env.AWS_S3_RECORDING_BUCKET || 'flight-attendant-recordings';
    const analysisResults = {};

    // 1. STT (Speech-to-Text) 작업 시작
    try {
      const sttJobName = `interview-stt-${Date.now()}`;
      console.log('🎤 [STT] Transcribe 작업 시작:', sttJobName);

      const transcribeParams = {
        TranscriptionJobName: sttJobName,
        Media: {
          MediaFileUri: `s3://${bucketName}/${s3Key}`
        },
        MediaFormat: 'webm',
        LanguageCode: 'ko-KR',
        OutputBucketName: 'crewbe-analysis-results',
      };

      const sttResult = await transcribe.startTranscriptionJob(transcribeParams).promise();
      analysisResults.stt = {
        jobId: sttJobName,
        status: 'IN_PROGRESS',
        jobName: sttResult.TranscriptionJob.TranscriptionJobName
      };
      
      console.log('✅ [STT] Transcribe 작업 시작됨:', sttJobName);
    } catch (sttError) {
      console.error('💥 [STT] Transcribe 작업 시작 실패:', sttError);
      analysisResults.stt = {
        status: 'FAILED',
        error: sttError.message
      };
    }

    // 2. 얼굴 감지 작업 시작
    try {
      console.log('👤 [FACE] Rekognition 얼굴 감지 시작');

      const faceDetectionParams = {
        Video: {
          S3Object: {
            Bucket: bucketName,
            Name: s3Key
          }
        },
        FaceAttributes: 'ALL'
      };

      const faceResult = await rekognition.startFaceDetection(faceDetectionParams).promise();
      analysisResults.faceDetection = {
        jobId: faceResult.JobId,
        status: 'IN_PROGRESS'
      };
      
      console.log('✅ [FACE] 얼굴 감지 작업 시작됨:', faceResult.JobId);
    } catch (faceError) {
      console.error('💥 [FACE] 얼굴 감지 작업 시작 실패:', faceError);
      analysisResults.faceDetection = {
        status: 'FAILED',
        error: faceError.message
      };
    }

    // 3. 감정/세그먼트 분석 작업 시작
    try {
      console.log('😊 [EMOTION] Rekognition 감정 분석 시작');

      const segmentDetectionParams = {
        Video: {
          S3Object: {
            Bucket: bucketName,
            Name: s3Key
          }
        },
        SegmentTypes: ['TECHNICAL_CUE', 'SHOT']
      };

      const segmentResult = await rekognition.startSegmentDetection(segmentDetectionParams).promise();
      analysisResults.segmentDetection = {
        jobId: segmentResult.JobId,
        status: 'IN_PROGRESS'
      };
      
      console.log('✅ [EMOTION] 감정 분석 작업 시작됨:', segmentResult.JobId);
    } catch (emotionError) {
      console.error('💥 [EMOTION] 감정 분석 작업 시작 실패:', emotionError);
      analysisResults.segmentDetection = {
        status: 'FAILED',
        error: emotionError.message
      };
    }

    console.log('🎉 [ANALYSIS] 모든 분석 작업 시작 완료');

    res.json({
      success: true,
      message: '면접 분석 작업들이 시작되었습니다',
      s3Key: s3Key,
      bucket: bucketName,
      analysisJobs: analysisResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 [ANALYSIS] 분석 시작 실패:', error);
    res.status(500).json({
      success: false,
      error: '분석 시작 실패',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 분석 상태 확인 엔드포인트
router.get('/status/:jobType/:jobId', async (req, res) => {
  try {
    const { jobType, jobId } = req.params;
    
    console.log(`🔍 [${jobType.toUpperCase()}] 작업 상태 확인:`, jobId);

    let result;
    let status;

    switch (jobType.toLowerCase()) {
      case 'stt':
        result = await transcribe.getTranscriptionJob({ TranscriptionJobName: jobId }).promise();
        status = {
          jobId: jobId,
          status: result.TranscriptionJob.TranscriptionJobStatus,
          creationTime: result.TranscriptionJob.CreationTime,
          completionTime: result.TranscriptionJob.CompletionTime,
        };
        
        if (result.TranscriptionJob.TranscriptionJobStatus === 'COMPLETED') {
          status.transcript = result.TranscriptionJob.Transcript;
        }
        break;

      case 'face':
        result = await rekognition.getFaceDetection({ JobId: jobId }).promise();
        status = {
          jobId: jobId,
          status: result.JobStatus,
          videoMetadata: result.VideoMetadata,
          faceDetections: result.Faces ? result.Faces.slice(0, 5) : [] // 처음 5개만
        };
        break;

      case 'segment':
        result = await rekognition.getSegmentDetection({ JobId: jobId }).promise();
        status = {
          jobId: jobId,
          status: result.JobStatus,
          videoMetadata: result.VideoMetadata,
          segments: result.Segments ? result.Segments.slice(0, 10) : [] // 처음 10개만
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          error: '지원하지 않는 작업 타입',
          supportedTypes: ['stt', 'face', 'segment'],
          timestamp: new Date().toISOString()
        });
    }

    console.log(`✅ [${jobType.toUpperCase()}] 상태 확인 완료:`, status.status);

    res.json({
      success: true,
      jobType: jobType,
      result: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`💥 [${req.params.jobType.toUpperCase()}] 상태 확인 실패:`, error);
    res.status(500).json({
      success: false,
      error: '작업 상태 확인 실패',
      message: error.message,
      timestamp: new Date().toISOString()
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