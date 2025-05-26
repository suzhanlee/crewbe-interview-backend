import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { COLORS } from '../../utils/constants';
import { useInterviews } from '../../contexts/InterviewContext';
import { InterviewFeedback } from '../../contexts/InterviewContext';
import { useUser } from '../../contexts/UserContext';

const ProfileScreen = () => {
  const { feedbacks } = useInterviews();
  const [selectedFeedback, setSelectedFeedback] = useState<InterviewFeedback | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { username } = useUser();

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleFeedbackPress = (feedback: InterviewFeedback) => {
    setSelectedFeedback(feedback);
    setShowModal(true);
  };

  return (
    <ScrollView style={styles.container}>
      {/* 프로필 헤더 섹션 */}
      <View style={styles.header}>
        <View style={styles.profileImage}>
          <Text style={styles.profileImageText}>프로필</Text>
        </View>
        <Text style={styles.name}>{username}</Text>
      </View>

      {/* 면접 피드백 섹션 */}
      <View style={styles.feedbackSection}>
        <Text style={styles.sectionTitle}>모의 면접 기록</Text>
        
        {feedbacks.length > 0 ? (
          feedbacks.map((feedback) => (
            <TouchableOpacity 
              key={feedback.id} 
              style={styles.feedbackItem}
              onPress={() => handleFeedbackPress(feedback)}
            >
              <View style={styles.feedbackHeader}>
                <Text style={styles.airlineName}>{feedback.airline}</Text>
                <Text style={styles.feedbackDate}>{feedback.date}</Text>
              </View>
              
              <View style={styles.scoreRow}>
                <Text style={styles.score}>점수: {feedback.score}점</Text>
                <Text style={styles.duration}>
                  면접 시간: {formatTime(feedback.duration)}
                </Text>
              </View>

              <Text style={styles.feedbackText} numberOfLines={2}>
                {feedback.feedback}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyFeedback}>
            <Text style={styles.emptyText}>아직 면접 기록이 없습니다</Text>
            <Text style={styles.emptySubText}>
              모의 면접 탭에서 면접을 시작해보세요!
            </Text>
          </View>
        )}
      </View>

      {/* 상세 결과 모달 */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedFeedback && (
              <ScrollView style={styles.modalScroll}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>면접 분석 리포트</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setShowModal(false)}
                  >
                    <Text style={styles.closeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>지원자 정보</Text>
                    <Text style={styles.modalInfoText}>이름: {selectedFeedback.username}</Text>
                    <Text style={styles.modalInfoText}>지원 항공사: {selectedFeedback.airline}</Text>
                    <Text style={styles.modalInfoText}>지원 직무: 객실 승무원</Text>
                    <Text style={styles.modalInfoText}>면접 일자: {selectedFeedback.date}</Text>
                    <Text style={styles.modalInfoText}>평가 버전: AI 면접 테스트 V1.0</Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>면접 결과 요약</Text>
                    <Text style={styles.modalScoreText}>총점: {selectedFeedback.score} / 100</Text>
                    <Text style={styles.modalGradeText}>합격 예측 등급: {selectedFeedback.grade}</Text>
                    <Text style={styles.modalDurationText}>총 면접 시간: {formatTime(selectedFeedback.duration)}</Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>전반적인 평가</Text>
                    <Text style={styles.modalText}>{selectedFeedback.feedback}</Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>세부 평가 결과</Text>
                    <Text style={styles.modalSubTitle}>음성 정확도 ({selectedFeedback.detailedScores.voiceAccuracy}점)</Text>
                    <Text style={styles.modalText}>{selectedFeedback.detailedFeedback.voiceAccuracyDetail}</Text>
                    
                    <Text style={styles.modalSubTitle}>표정 분석 ({selectedFeedback.detailedScores.expression}점)</Text>
                    <Text style={styles.modalText}>{selectedFeedback.detailedFeedback.expressionDetail}</Text>
                    
                    <Text style={styles.modalSubTitle}>말투 & 속도 ({selectedFeedback.detailedScores.speechPattern}점)</Text>
                    <Text style={styles.modalText}>{selectedFeedback.detailedFeedback.speechPatternDetail}</Text>
                    
                    <Text style={styles.modalSubTitle}>답변 퀄리티 ({selectedFeedback.detailedScores.answerQuality}점)</Text>
                    <Text style={styles.modalText}>{selectedFeedback.detailedFeedback.answerQualityDetail}</Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>개선사항</Text>
                    {selectedFeedback.improvements.map((item, index) => (
                      <Text key={index} style={styles.modalImprovement}>• {item}</Text>
                    ))}
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>추천 조치사항</Text>
                    {selectedFeedback.recommendedActions.map((item, index) => (
                      <Text key={index} style={styles.modalRecommendation}>• {item}</Text>
                    ))}
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileImageText: {
    color: '#666',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  feedbackSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: COLORS.text,
  },
  feedbackItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  airlineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  feedbackDate: {
    fontSize: 14,
    color: '#666',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  score: {
    fontSize: 15,
    color: COLORS.text,
  },
  duration: {
    fontSize: 15,
    color: COLORS.text,
  },
  feedbackText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyFeedback: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  modalBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.text,
  },
  modalInfoText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 5,
  },
  modalScoreText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 15,
  },
  modalGradeText: {
    fontSize: 18,
    color: COLORS.primary,
    marginBottom: 15,
  },
  modalDurationText: {
    fontSize: 18,
    color: COLORS.primary,
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
    marginBottom: 10,
  },
  modalSubTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 15,
    marginBottom: 5,
  },
  modalImprovement: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
    marginBottom: 5,
  },
  modalRecommendation: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 5,
    color: COLORS.text,
  },
  modalScroll: {
    maxHeight: '100%',
  },
});

export default ProfileScreen; 