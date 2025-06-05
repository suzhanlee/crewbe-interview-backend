const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testAPI() {
  console.log('🔧 [TEST] API 테스트 시작');
  
  try {
    // 1. 헬스 체크
    console.log('🔄 [TEST] 헬스 체크...');
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('✅ [HEALTH]', healthResponse.data);
    
    // 2. Pre-signed URL 생성 테스트
    console.log('🔄 [TEST] Pre-signed URL 생성...');
    const presignedResponse = await axios.post(`${BASE_URL}/upload/presigned-url`, {
      fileName: 'test-interview.webm',
      fileType: 'video/webm'
    });
    console.log('✅ [PRESIGNED]', {
      success: presignedResponse.data.success,
      s3Key: presignedResponse.data.s3Key,
      bucket: presignedResponse.data.bucket,
      urlLength: presignedResponse.data.presignedUrl.length
    });
    
    // 3. 분석 시작 테스트 (실제 S3 키로)
    console.log('🔄 [TEST] 분석 시작...');
    const analysisResponse = await axios.post(`${BASE_URL}/analysis/start`, {
      s3Key: presignedResponse.data.s3Key,
      bucket: presignedResponse.data.bucket
    });
    console.log('✅ [ANALYSIS]', {
      success: analysisResponse.data.success,
      message: analysisResponse.data.message,
      jobs: analysisResponse.data.analysisJobs
    });
    
    const jobs = analysisResponse.data.analysisJobs;
    
    // 4. 분석 상태 확인 테스트
    if (jobs.stt && jobs.stt.jobId) {
      console.log('🔄 [TEST] STT 상태 확인...');
      try {
        const sttStatus = await axios.get(`${BASE_URL}/analysis/status/stt/${jobs.stt.jobId}`);
        console.log('✅ [STT_STATUS]', sttStatus.data.result);
      } catch (sttError) {
        console.log('⚠️ [STT_STATUS] 에러 (예상됨):', sttError.response?.data?.message || sttError.message);
      }
    }
    
    if (jobs.faceDetection && jobs.faceDetection.jobId) {
      console.log('🔄 [TEST] Face Detection 상태 확인...');
      try {
        const faceStatus = await axios.get(`${BASE_URL}/analysis/status/face/${jobs.faceDetection.jobId}`);
        console.log('✅ [FACE_STATUS]', faceStatus.data.result);
      } catch (faceError) {
        console.log('⚠️ [FACE_STATUS] 에러 (예상됨):', faceError.response?.data?.message || faceError.message);
      }
    }
    
    // 5. 일괄 상태 확인 테스트
    console.log('🔄 [TEST] 일괄 상태 확인...');
    try {
      const allStatusResponse = await axios.post(`${BASE_URL}/analysis/status-all`, {
        jobs: {
          stt: jobs.stt?.jobId,
          face: jobs.faceDetection?.jobId,
          segment: jobs.segmentDetection?.jobId
        }
      });
      console.log('✅ [ALL_STATUS]', allStatusResponse.data.results);
    } catch (allError) {
      console.log('⚠️ [ALL_STATUS] 에러 (예상됨):', allError.response?.data?.message || allError.message);
    }
    
    // 6. 분석 요약 생성 테스트
    console.log('🔄 [TEST] 분석 요약 생성...');
    const summaryResponse = await axios.post(`${BASE_URL}/analysis/summary`, {
      jobs: {
        stt: jobs.stt?.jobId,
        face: jobs.faceDetection?.jobId,
        segment: jobs.segmentDetection?.jobId
      }
    });
    console.log('✅ [SUMMARY]', summaryResponse.data.summary);
    
    console.log('🎉 [TEST] 모든 API 테스트 완료!');
    
  } catch (error) {
    console.error('💥 [TEST] 에러:', error.response?.data || error.message);
  }
}

testAPI(); 