import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { COLORS } from '../../utils/constants';
import Button from '../../components/common/Button';
import { api } from '../../api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { MockInterviewScreenNavigationProp } from '../../types/navigation';
import { AIRLINES, Airline } from '../../constants/airlines';

interface InterviewReport {
  score: number;
  feedback: string;
  improvements: string[];
  duration: number;
}

const MockInterviewScreen = () => {
  const navigation = useNavigation<MockInterviewScreenNavigationProp>();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [camera, setCamera] = useState<Camera | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [isInterviewing, setIsInterviewing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedAirline, setSelectedAirline] = useState<Airline | null>(null);
  const [showAirlineSelection, setShowAirlineSelection] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

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
        
        if (hasVideoDevice) {
          requestCameraPermission();
        } else {
          setHasPermission(false);
        }
      } catch (err) {
        console.warn('카메라 확인 실패:', err);
        setHasCamera(false);
        setHasPermission(false);
      }
    } else if (Platform.OS === 'android') {
      requestCameraPermission();
    } else {
      setHasPermission(true); // iOS는 자동으로 권한 허용
    }
  };

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          '카메라 권한 필요',
          '모의 면접을 위해 카메라 접근 권한이 필요합니다.',
          [
            {
              text: '설정으로 이동',
              onPress: () => {
                // 설정으로 이동하는 로직
                console.log('설정으로 이동');
              },
            },
            {
              text: '취소',
              style: 'cancel',
            },
          ]
        );
      }
      setHasPermission(status === 'granted');
    } catch (err) {
      console.warn('카메라 권한 요청 실패:', err);
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
    } else {
      stopTimer();
      setIsInterviewing(false);
      setIsAnalyzing(true);
      
      // 10초 후에 임시 리포트 데이터 표시
      setTimeout(() => {
        const mockReport: InterviewReport = {
          score: 85,
          feedback: "전반적으로 좋은 면접 태도를 보여주셨습니다. 답변 시 구체적인 예시를 들어 설명하는 점이 인상적이었습니다. 다만, 시선 처리와 목소리 톤에서 약간의 개선이 필요해 보입니다.",
          improvements: [
            "답변 시 시선을 더 일관되게 유지해보세요",
            "중요한 포인트에서 목소리 톤의 변화를 주면 좋겠습니다",
            "긴장된 모습이 보이니 호흡을 조금 더 안정적으로 가져가보세요"
          ],
          duration: timer
        };
        
        setReport(mockReport);
        setIsAnalyzing(false);
      }, 10000);

      /* 실제 API 호출 코드는 주석 처리
      try {
        const response = await api.post('/interview/analyze', {
          // 면접 데이터
        });
        setReport(response.data);
      } catch (error) {
        console.error('분석 실패:', error);
        Alert.alert('오류', '분석 중 문제가 발생했습니다.');
      } finally {
        setIsAnalyzing(false);
      }
      */
    }
  };

  const handleSaveReport = async () => {
    // API 호출 없이 바로 저장 완료 처리
    setIsSaved(true);

    /* 실제 API 호출 코드는 주석 처리
    try {
      await api.post('/interview/save', {
        report
      });
      setIsSaved(true);
    } catch (error) {
      console.error('저장 실패:', error);
      Alert.alert('오류', '저장 중 문제가 발생했습니다.');
    }
    */
  };

  const handleStartInterview = () => {
    setShowAirlineSelection(true);
  };

  const handleAirlineSelect = (airline: Airline) => {
    setSelectedAirline(airline);
    setShowAirlineSelection(false);
    setIsInterviewing(true);
    setTimer(0);
    startTimer();
  };

  const resetInterviewState = () => {
    setIsInterviewing(false);
    setReport(null);
    setIsSaved(false);
    setIsAnalyzing(false);
    setShowAirlineSelection(false);
    setSelectedAirline(null);
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

  if (report) {
    return (
      <View style={styles.container}>
        <View style={styles.reportContainer}>
          <Text style={styles.reportTitle}>면접 분석 리포트</Text>
          <Text style={styles.scoreText}>점수: {report.score}점</Text>
          <Text style={styles.durationText}>
            총 면접 시간: {formatTime(report.duration)}
          </Text>
          <Text style={styles.feedbackTitle}>피드백</Text>
          <Text style={styles.feedbackText}>{report.feedback}</Text>
          <Text style={styles.improvementsTitle}>개선사항</Text>
          {report.improvements.map((item, index) => (
            <Text key={index} style={styles.improvementItem}>• {item}</Text>
          ))}
        </View>
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
              key={airline.id}
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
  if (isInterviewing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.timerContainer}>
            <Text style={styles.timer}>{formatTime(timer)}</Text>
          </View>
          <Text style={styles.selectedAirline}>
            {selectedAirline?.name} 면접 진행 중
          </Text>
        </View>
        <View style={styles.cameraContainer}>
          <Camera 
            ref={ref => setCamera(ref)}
            style={styles.camera} 
            type={CameraType.front}
          />
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
        <Camera 
          ref={ref => setCamera(ref)}
          style={styles.camera} 
          type={CameraType.front}
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
    width: 300,
    height: 300,
    borderRadius: 150,
    overflow: 'hidden',
    marginVertical: 30,
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
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
  durationText: {
    fontSize: 18,
    color: COLORS.primary,
    marginBottom: 15,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.text,
  },
  feedbackText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    color: COLORS.text,
  },
  improvementsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.text,
  },
  improvementItem: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 5,
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
});

export default MockInterviewScreen; 