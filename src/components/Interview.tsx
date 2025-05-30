import React, { useEffect, useRef } from 'react';
import { useRecorder } from '../hooks/useRecorder';

type InterviewState = 'idle' | 'recording' | 'uploading' | 'done';

const Interview: React.FC = () => {
  const { isRecording, isUploading, stream, error, logs, start, stop, clearLogs } = useRecorder();
  const videoRef = useRef<HTMLVideoElement>(null);

  // 상태 계산
  const getState = (): InterviewState => {
    if (isUploading) return 'uploading';
    if (isRecording) return 'recording';
    if (logs.some(log => log.includes('✅ S3 업로드 성공'))) return 'done';
    return 'idle';
  };

  const state = getState();

  // 비디오 스트림 연결
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // 컴포넌트 언마운트 시 스트림 정리
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleStart = async () => {
    await start();
  };

  const handleStop = async () => {
    await stop();
  };

  const getButtonText = () => {
    switch (state) {
      case 'idle':
        return '🎥 녹화 시작';
      case 'recording':
        return '⏹️ 녹화 중단';
      case 'uploading':
        return '⏳ 업로드 중...';
      case 'done':
        return '✅ 완료';
    }
  };

  const getStatusColor = () => {
    switch (state) {
      case 'idle':
        return '#007AFF';
      case 'recording':
        return '#FF3B30';
      case 'uploading':
        return '#FF9500';
      case 'done':
        return '#34C759';
    }
  };

  const isButtonDisabled = state === 'uploading' || state === 'done';

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
        🎤 AI 면접 녹화
      </h1>

      {/* 상태 표시 */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: getStatusColor() + '20',
        borderRadius: '8px',
        border: `2px solid ${getStatusColor()}`
      }}>
        <h2 style={{ margin: 0, color: getStatusColor() }}>
          상태: {state.toUpperCase()}
        </h2>
      </div>

      {/* 비디오 미리보기 */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: '100%',
            maxWidth: '640px',
            height: 'auto',
            backgroundColor: '#000',
            borderRadius: '8px',
            border: stream ? '2px solid #34C759' : '2px solid #C7C7CC'
          }}
        />
        {!stream && (
          <p style={{ 
            color: '#8E8E93', 
            fontSize: '14px', 
            marginTop: '10px' 
          }}>
            녹화를 시작하면 미리보기가 여기에 표시됩니다
          </p>
        )}
      </div>

      {/* 컨트롤 버튼 */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <button
          onClick={state === 'idle' ? handleStart : handleStop}
          disabled={isButtonDisabled}
          style={{
            padding: '15px 30px',
            fontSize: '18px',
            fontWeight: 'bold',
            backgroundColor: isButtonDisabled ? '#C7C7CC' : getStatusColor(),
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
            marginRight: '10px',
            transition: 'all 0.2s ease'
          }}
        >
          {getButtonText()}
        </button>

        <button
          onClick={clearLogs}
          style={{
            padding: '15px 30px',
            fontSize: '16px',
            backgroundColor: '#8E8E93',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          🗑️ 로그 초기화
        </button>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div style={{
          backgroundColor: '#FF3B3020',
          border: '2px solid #FF3B30',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#FF3B30' }}>
            ❌ 오류 발생
          </h3>
          <p style={{ margin: 0, color: '#FF3B30' }}>{error}</p>
        </div>
      )}

      {/* 로그 표시 */}
      <div style={{
        backgroundColor: '#F2F2F7',
        border: '1px solid #C7C7CC',
        borderRadius: '8px',
        padding: '15px'
      }}>
        <h3 style={{ marginTop: 0, color: '#000' }}>
          📋 진행 로그 ({logs.length})
        </h3>
        <pre style={{
          backgroundColor: '#000',
          color: '#00FF00',
          padding: '15px',
          borderRadius: '4px',
          fontSize: '12px',
          lineHeight: '1.4',
          maxHeight: '300px',
          overflow: 'auto',
          margin: 0,
          fontFamily: 'Monaco, Consolas, monospace'
        }}>
          {logs.length > 0 
            ? logs.join('\n') 
            : '로그가 여기에 표시됩니다...'}
        </pre>
      </div>
    </div>
  );
};

export default Interview; 