import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { COLORS } from '../../utils/constants';
import Button from '../../components/common/Button';
import { api } from '../../api';

interface InterviewReport {
  score: number;
  feedback: string;
  improvements: string[];
}

const MockInterviewScreen = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [camera, setCamera] = useState<Camera | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [isInterviewing, setIsInterviewing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    checkCameraAvailability();
  }, []);

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

  const handleInterviewToggle = async () => {
    if (!isInterviewing) {
      setIsInterviewing(true);
    } else {
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
          ]
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

  if (isSaved) {
    return (
      <View style={styles.container}>
        <Text style={styles.successText}>저장이 완료되었습니다!</Text>
        <Button 
          title="새로운 면접 시작하기" 
          onPress={() => {
            setIsInterviewing(false);
            setReport(null);
            setIsSaved(false);
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
          <Text style={styles.feedbackTitle}>피드백</Text>
          <Text style={styles.feedbackText}>{report.feedback}</Text>
          <Text style={styles.improvementsTitle}>개선사항</Text>
          {report.improvements.map((item, index) => (
            <Text key={index} style={styles.improvementItem}>• {item}</Text>
          ))}
        </View>
        <Button 
          title="저장하기" 
          onPress={handleSaveReport} 
        />
      </View>
    );
  }

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
          title={isInterviewing ? "종료하기" : "모의 면접 시작하기"} 
          onPress={handleInterviewToggle} 
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
  }
});

export default MockInterviewScreen; 