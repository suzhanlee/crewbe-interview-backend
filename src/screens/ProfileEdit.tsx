import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS } from '../constants';
import { ProfileData } from '../types/profile';
import { uploadToS3 } from '../utils/s3Upload';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (data: ProfileData) => void;
  initialData?: ProfileData;
}

const ProfileEdit: React.FC<Props> = ({ visible, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<ProfileData>({
    name: initialData?.name || '',
    gender: initialData?.gender || '',
    age: initialData?.age || '',
    height: initialData?.height || '',
    weight: initialData?.weight || '',
    university: initialData?.university || '',
    gpa: initialData?.gpa || '',
    languageScore: initialData?.languageScore || '',
    videoUri: initialData?.videoUri || '',
    photoUri: initialData?.photoUri || '',
  });

  const [uploading, setUploading] = useState(false);

  const updateField = (field: keyof ProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        Alert.alert(
          '비디오 업로드',
          '선택한 비디오를 AWS S3에 업로드하시겠습니까?',
          [
            { text: '취소', style: 'cancel' },
            { text: '업로드', onPress: () => uploadFile(asset.uri, asset.name, 'video') },
          ]
        );
      }
    } catch (error) {
      Alert.alert('오류', '비디오 선택 중 오류가 발생했습니다.');
    }
  };

  const pickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        Alert.alert(
          '사진 업로드',
          '선택한 사진을 AWS S3에 업로드하시겠습니까?',
          [
            { text: '취소', style: 'cancel' },
            { text: '업로드', onPress: () => uploadFile(asset.uri, 'photo.jpg', 'image') },
          ]
        );
      }
    } catch (error) {
      Alert.alert('오류', '사진 선택 중 오류가 발생했습니다.');
    }
  };

  const uploadFile = async (uri: string, fileName: string, type: 'video' | 'image') => {
    setUploading(true);
    try {
      const fileType = type === 'video' ? 'video/mp4' : 'image/jpeg';
      const result = await uploadToS3(uri, fileName, fileType);

      if (result.success && result.url) {
        if (type === 'video') {
          updateField('videoUri', result.url);
        } else {
          updateField('photoUri', result.url);
        }
        Alert.alert('성공', `${type === 'video' ? '비디오' : '사진'} 업로드가 완료되었습니다.`);
      } else {
        Alert.alert('오류', result.error || '업로드에 실패했습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    // 필수 필드 검증
    if (!formData.name.trim()) {
      Alert.alert('오류', '이름을 입력해주세요.');
      return;
    }

    // 임시 저장 (실제 앱에서는 데이터가 종료 시 삭제됨)
    onSave(formData);
    Alert.alert('저장 완료', '프로필이 임시 저장되었습니다.\n(앱 종료 시 데이터가 삭제됩니다)');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>취소</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>프로필 편집</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>저장</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* 파일 업로드 섹션 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📷 미디어 업로드</Text>
            
            <TouchableOpacity style={styles.uploadButton} onPress={pickVideo}>
              <Text style={styles.uploadButtonText}>
                {formData.videoUri ? '✅ 비디오 업로드 완료' : '📹 비디오 업로드'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.uploadButton} onPress={pickPhoto}>
              <Text style={styles.uploadButtonText}>
                {formData.photoUri ? '✅ 사진 업로드 완료' : '📸 사진 업로드'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 개인정보 섹션 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 개인정보</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>이름 *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => updateField('name', text)}
                placeholder="이름을 입력하세요"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>성별</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.gender}
                  onValueChange={(value) => updateField('gender', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="선택하세요" value="" />
                  <Picker.Item label="남성" value="남성" />
                  <Picker.Item label="여성" value="여성" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>나이</Text>
              <TextInput
                style={styles.input}
                value={formData.age}
                onChangeText={(text) => updateField('age', text)}
                placeholder="나이를 입력하세요"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>키 (cm)</Text>
              <TextInput
                style={styles.input}
                value={formData.height}
                onChangeText={(text) => updateField('height', text)}
                placeholder="키를 입력하세요"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>몸무게 (kg)</Text>
              <TextInput
                style={styles.input}
                value={formData.weight}
                onChangeText={(text) => updateField('weight', text)}
                placeholder="몸무게를 입력하세요"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>대학교</Text>
              <TextInput
                style={styles.input}
                value={formData.university}
                onChangeText={(text) => updateField('university', text)}
                placeholder="대학교를 입력하세요"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>학점</Text>
              <TextInput
                style={styles.input}
                value={formData.gpa}
                onChangeText={(text) => updateField('gpa', text)}
                placeholder="학점을 입력하세요 (예: 3.8/4.5)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>어학점수</Text>
              <TextInput
                style={styles.input}
                value={formData.languageScore}
                onChangeText={(text) => updateField('languageScore', text)}
                placeholder="어학점수를 입력하세요 (예: TOEIC 900)"
              />
            </View>
          </View>

          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              ⚠️ 임시 저장 기능입니다. 앱을 종료하면 데이터가 삭제됩니다.
            </Text>
          </View>
        </ScrollView>

        {uploading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>업로드 중...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 50,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: COLORS.gray,
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.text,
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: COLORS.text,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  picker: {
    height: 50,
  },
  notice: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 32,
  },
  noticeText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
});

export default ProfileEdit; 