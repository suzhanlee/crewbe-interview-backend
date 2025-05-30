import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { COLORS } from '../../constants';
import Button from '../../components/common/Button';
import { api } from '../../api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { MockInterviewScreenNavigationProp } from '../../types/navigation';
import { BaseAirline, getRandomQuestion, AIRLINES } from '../../models/Airline';
import { useInterviews } from '../../contexts/InterviewContext';
import { useUser } from '../../contexts/UserContext';
import { getRandomFeedback, FeedbackDetail, DetailedScore } from '../../models/InterviewFeedback';

// 웹 전용 임포트 (조건부)
let useRecorder: any = null;
let PRESIGNED_PUT_URL: string = '';

if (Platform.OS === 'web') {
  try {
    const webModules = require('../../hooks/useRecorder');
    useRecorder = webModules.useRecorder;
    const constants = require('../../constants');
    PRESIGNED_PUT_URL = constants.PRESIGNED_PUT_URL;
  } catch (e) {
    console.warn('웹 모듈 로드 실패:', e);
  }
}

interface InterviewReport {
  id: string;
  date: string;
  airline: string;
  username: string;
  score: number;
  feedback: string;
  duration: number;
  improvements: string[];
  grade: string;
  detailedScores: DetailedScore;
  voiceAnalysis: string;
  expressionAnalysis: string;
  speechAnalysis: string;
  answerAnalysis: string;
  detailedFeedback: {
    voiceAccuracyDetail: string;
    expressionDetail: string;
    speechPatternDetail: string;
    answerQualityDetail: string;
  };
  recommendedActions: string[];
}

const MockInterviewScreen = () => {
  const navigation = useNavigation<MockInterviewScreenNavigationProp>();
  const [permission, requestPermission] = useCameraPermissions();
  const [camera, setCamera] = useState<CameraView | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [isInterviewing, setIsInterviewing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedAirline, setSelectedAirline] = useState<BaseAirline | null>(null);
  const [showAirlineSelection, setShowAirlineSelection] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const { feedbacks, setFeedbacks } = useInterviews();
  const { username } = useUser();
  const [currentFeedback, setCurrentFeedback] = useState<FeedbackDetail | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');

  // 웹 환경에서만 녹화 훅 사용
  const webRecorder = Platform.OS === 'web' && useRecorder ? useRecorder() : null;

  useEffect(() => {
    checkCameraAvailability();
  }, []);

  // 화면이 포커스를 받을 때마다 상태 초기화
  useFocusEffect(
    React.useCallback(() => {
      resetInterviewState();
    }, [])
  );

  const checkCameraAvailability = async () => {
    if (Platform.OS === 'web') {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideoDevice = devices.some(device => device.kind === 'videoinput');
        setHasCamera(hasVideoDevice);
      } catch (err) {
        console.warn('카메라 확인 실패:', err);
        setHasCamera(false);
      }
    } else if (Platform.OS === 'android') {
      if (!permission?.granted) {
        await requestPermission();
      }
    }
  };

  // 타이머 시작 함수
  const startTimer = () => {
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  // 타이머 정지 함수
  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  // 타이머 포맷 함수
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleInterviewToggle = async () => {
    if (!isInterviewing) {
      setIsInterviewing(true);
      // 웹에서 녹화 시작
      if (Platform.OS === 'web' && webRecorder) {
        await webRecorder.start();
      }
    } else {
      stopTimer();
      setIsInterviewing(false);
      setIsAnalyzing(true);
      
      // 웹에서 녹화 중단 및 업로드
      if (Platform.OS === 'web' && webRecorder) {
        await webRecorder.stop();
      }
      
      setTimeout(() => {
        const feedback = getRandomFeedback(selectedAirline?.name || '', username);
        setCurrentFeedback(feedback);
        setIsAnalyzing(false);
      }, 3000);
    }
  };

  const handleSaveReport = async () => {
    if (currentFeedback) {
      const report: InterviewReport = {
        id: Date.now().toString(),
        date: currentFeedback.interviewDate,
        airline: currentFeedback.airline,
        username: currentFeedback.candidateName,
        score: currentFeedback.totalScore,
        feedback: currentFeedback.overallEvaluation,
        duration: timer,
        improvements: currentFeedback.improvements,
        grade: currentFeedback.grade,
        detailedScores: currentFeedback.detailedScores,
        voiceAnalysis: currentFeedback.voiceAnalysis,
        expressionAnalysis: currentFeedback.expressionAnalysis,
        speechAnalysis: currentFeedback.speechAnalysis,
        answerAnalysis: currentFeedback.answerAnalysis,
        detailedFeedback: currentFeedback.detailedFeedback,
        recommendedActions: currentFeedback.recommendedActions
      };
      
      setFeedbacks(prev => [...prev, report]);
      setIsSaved(true);
    }
  };

  const handleStartInterview = () => {
    setShowAirlineSelection(true);
  };

  const handleAirlineSelect = (airline: BaseAirline) => {
    setSelectedAirline(airline);
    setShowAirlineSelection(false);
    setIsInterviewing(true);
    setTimer(0);
    startTimer();
    const randomQuestion = airline.questions[Math.floor(Math.random() * airline.questions.length)];
    setCurrentQuestion(randomQuestion);
  };

  const resetInterviewState = () => {
    setIsInterviewing(false);
    setIsSaved(false);
    setIsAnalyzing(false);
    setShowAirlineSelection(false);
    setSelectedAirline(null);
    setCurrentFeedback(null);
    stopTimer();
    setTimer(0);
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  if (isSaved) {
    return (
      <View style={styles.container}>
        <Text style={styles.successText}>저장이 완료되었습니다!</Text>
        <Button 
          title="새로운 면접 시작하기" 
          onPress={() => {
            resetInterviewState();
            setShowAirlineSelection(true);
          }} 
        />
      </View>
    );
  }

  if (isAnalyzing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>분석중입니다...</Text>
      </View>
    );
  }

  if (currentFeedback) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.reportContainer}>
          <Text style={styles.reportTitle}>면접 분석 리포트</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>지원자 정보</Text>
            <Text style={styles.infoText}>이름: {currentFeedback.candidateName}</Text>
            <Text style={styles.infoText}>지원 항공사: {currentFeedback.airline}</Text>
            <Text style={styles.infoText}>지원 직무: {currentFeedback.position}</Text>
            <Text style={styles.infoText}>면접 일자: {currentFeedback.interviewDate}</Text>
            <Text style={styles.infoText}>평가 버전: {currentFeedback.version}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>면접 결과 요약</Text>
            <Text style={styles.scoreText}>총점: {currentFeedback.totalScore} / 100</Text>
            <Text style={styles.gradeText}>합격 예측 등급: {currentFeedback.grade}</Text>
            <Text style={styles.durationText}>총 면접 시간: {formatTime(timer)}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>전반적인 평가</Text>
            <Text style={styles.sectionText}>{currentFeedback.overallEvaluation}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>세부 평가 결과</Text>
            <Text style={styles.subTitle}>음성 정확도 ({currentFeedback.detailedScores.voiceAccuracy}점)</Text>
            <Text style={styles.sectionText}>{currentFeedback.detailedFeedback.voiceAccuracyDetail}</Text>
            
            <Text style={styles.subTitle}>표정 분석 ({currentFeedback.detailedScores.expression}점)</Text>
            <Text style={styles.sectionText}>{currentFeedback.detailedFeedback.expressionDetail}</Text>
            
            <Text style={styles.subTitle}>말투 & 속도 ({currentFeedback.detailedScores.speechPattern}점)</Text>
            <Text style={styles.sectionText}>{currentFeedback.detailedFeedback.speechPatternDetail}</Text>
            
            <Text style={styles.subTitle}>답변 퀄리티 ({currentFeedback.detailedScores.answerQuality}점)</Text>
            <Text style={styles.sectionText}>{currentFeedback.detailedFeedback.answerQualityDetail}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>개선사항</Text>
            {currentFeedback.improvements.map((item, index) => (
              <Text key={index} style={styles.improvementItem}>• {item}</Text>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>추천 조치사항</Text>
            {currentFeedback.recommendedActions.map((item, index) => (
              <Text key={index} style={styles.recommendationItem}>• {item}</Text>
            ))}
          </View>
        </ScrollView>

        <View style={styles.buttonGroup}>
          <Button 
            title="저장하기" 
            onPress={handleSaveReport} 
          />
          <View style={styles.buttonSpacing} />
          <Button 
            title="홈으로" 
            onPress={() => {
              resetInterviewState();
              navigation.navigate('Home');
            }} 
          />
        </View>
      </View>
    );
  }

  // 항공사 선택 화면
  if (showAirlineSelection) {
    return (
      <View style={styles.container}>
        <Text style={styles.selectionTitle}>항공사를 선택해주세요</Text>
        <ScrollView style={styles.airlineList}>
          {AIRLINES.map((airline) => (
            <TouchableOpacity
              key={airline.name}
              style={styles.airlineItem}
              onPress={() => handleAirlineSelect(airline)}
            >
              <Text style={styles.airlineName}>{airline.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  // 면접 진행 화면
  if (isInterviewing && selectedAirline) {
    if (Platform.OS === 'web' && webRecorder) {
      // 웹 환경에서의 녹화 화면
      return (
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.timerContainer}>
              <Text style={styles.timer}>{formatTime(timer)}</Text>
            </View>
            <Text style={styles.selectedAirline}>
              {selectedAirline.name} 면접 진행 중 (녹화 중)
            </Text>
          </View>
          
          <View style={styles.webCameraContainer}>
            {webRecorder.stream && (
              <video
                autoPlay
                muted
                playsInline
                style={{
                  width: '100%',
                  maxWidth: '640px',
                  height: 'auto',
                  backgroundColor: '#000',
                  borderRadius: 8,
                  border: '2px solid #34C759'
                }}
                ref={(video) => {
                  if (video && webRecorder.stream) {
                    video.srcObject = webRecorder.stream;
                  }
                }}
              />
            )}
            
            {/* 녹화 상태 표시 */}
            <View style={styles.recordingStatus}>
              <Text style={styles.recordingText}>
                🔴 녹화 중 {webRecorder.isUploading && '- 업로드 중...'}
              </Text>
            </View>
          </View>

          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>{currentQuestion}</Text>
          </View>

          {/* 웹 로그 표시 - 전체 로그를 ScrollView로 */}
          <View style={styles.webLogContainer}>
            <Text style={styles.logTitle}>
              📋 면접 로그 {webRecorder.isAnalyzing && '(분석 중...)'}
            </Text>
            <ScrollView style={styles.logScrollView} showsVerticalScrollIndicator={true}>
              <Text style={styles.logText}>
                {webRecorder.logs.join('\n')}
              </Text>
            </ScrollView>
          </View>

          {webRecorder.error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>❌ {webRecorder.error}</Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button 
              title={
                webRecorder.isUploading 
                  ? "업로드 중..." 
                  : webRecorder.isAnalyzing 
                    ? "분석 중..." 
                    : "종료하기"
              }
              onPress={handleInterviewToggle}
              disabled={webRecorder.isUploading || webRecorder.isAnalyzing}
            />
          </View>
        </View>
      );
    }
    
    // React Native 환경에서의 기존 카메라 화면
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.timerContainer}>
            <Text style={styles.timer}>{formatTime(timer)}</Text>
          </View>
          <Text style={styles.selectedAirline}>
            {selectedAirline.name} 면접 진행 중
          </Text>
        </View>
        
        <View style={styles.cameraContainer}>
          <CameraView 
            ref={ref => setCamera(ref)}
            style={styles.camera} 
            facing="front"
          />
        </View>

        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button 
            title="종료하기"
            onPress={handleInterviewToggle} 
          />
        </View>
      </View>
    );
  }

  // 초기 화면
  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView 
          ref={ref => setCamera(ref)}
          style={styles.camera} 
          facing="front"
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button 
          title="모의 면접 시작하기"
          onPress={handleStartInterview} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    padding: 20,
  },
  cameraContainer: {
    width: '100%',
    aspectRatio: 4/3,
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  camera: {
    flex: 1,
    aspectRatio: 4/3,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 20,
  },
  errorContainer: {
    width: '100%',
    padding: 15,
    backgroundColor: '#fee',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
    marginTop: 10,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: COLORS.text,
  },
  reportContainer: {
    flex: 1,
    width: '100%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 20,
  },
  reportTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: COLORS.text,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 15,
  },
  gradeText: {
    fontSize: 18,
    color: COLORS.primary,
    marginBottom: 15,
  },
  durationText: {
    fontSize: 18,
    color: COLORS.primary,
    marginBottom: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.text,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
  },
  successText: {
    fontSize: 20,
    color: 'green',
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonGroup: {
    width: '100%',
    marginTop: 20,
    gap: 10,
  },
  buttonSpacing: {
    height: 10,
  },
  selectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: COLORS.text,
  },
  airlineList: {
    width: '100%',
  },
  airlineItem: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  airlineName: {
    fontSize: 18,
    color: COLORS.text,
  },
  header: {
    width: '100%',
    marginBottom: 20,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  timer: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF0000',
  },
  selectedAirline: {
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
  },
  questionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 10,
    marginVertical: 20,
    width: '100%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  questionText: {
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  improvementItem: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 5,
    color: COLORS.text,
  },
  infoText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 5,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 15,
    marginBottom: 5,
  },
  recommendationItem: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 5,
    color: COLORS.text,
  },
  interviewContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    padding: 20,
  },
  webCameraContainer: {
    width: '100%',
    aspectRatio: 4/3,
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  recordingStatus: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF0000',
  },
  webLogContainer: {
    width: '100%',
    height: 200,
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.text,
  },
  logScrollView: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  logText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: COLORS.text,
    lineHeight: 16,
  },
});

export default MockInterviewScreen; 