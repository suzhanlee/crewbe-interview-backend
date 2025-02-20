import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { COLORS } from '../../utils/constants';
import Button from '../../components/common/Button';

const MockInterviewScreen = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [camera, setCamera] = useState<Camera | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(true);

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

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>카메라를 확인하는 중...</Text>
      </View>
    );
  }

  if (!hasCamera) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          카메라를 찾을 수 없습니다.{'\n'}
          카메라가 연결된 기기에서 시도해주세요.
        </Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>카메라 접근 권한이 필요합니다</Text>
        <Button 
          title="권한 다시 요청" 
          onPress={requestCameraPermission} 
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
          title="모의 면접 시작하기" 
          onPress={() => {
            // 면접 시작 로직
            console.log('면접 시작');
          }} 
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
  }
});

export default MockInterviewScreen; 