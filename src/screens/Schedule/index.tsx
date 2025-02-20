import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { COLORS } from '../../utils/constants';
import { Ionicons } from '@expo/vector-icons';

interface SalaryEntry {
  id: string;
  year: string;
  month: string;
  amount: string;
}

interface ScheduleEntry {
  id: string;
  date: string;
  title: string;
  description: string;
}

const ScheduleScreen = () => {
  const [salaryEntries, setSalaryEntries] = useState<SalaryEntry[]>([]);
  const [showYearPicker, setShowYearPicker] = useState<string | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // 일정 관련 state 추가
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    title: '',
    description: '',
  });

  const [isEditMode, setIsEditMode] = useState(false);  // 수정 모드 상태 추가
  const [editingSchedule, setEditingSchedule] = useState<ScheduleEntry | null>(null);  // 수정 중인 일정

  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - 5 + i).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  // 캘린더에 표시할 일정 마커 생성
  const markedDates = schedules.reduce((acc, schedule) => {
    acc[schedule.date] = { marked: true, dotColor: COLORS.primary };
    return acc;
  }, {} as { [key: string]: { marked: boolean; dotColor: string } });

  const addNewEntry = () => {
    const newEntry: SalaryEntry = {
      id: Date.now().toString(),
      year: new Date().getFullYear().toString(),
      month: (new Date().getMonth() + 1).toString().padStart(2, '0'),
      amount: ''
    };
    setSalaryEntries([...salaryEntries, newEntry]);
  };

  const removeEntry = (id: string) => {
    setSalaryEntries(salaryEntries.filter(entry => entry.id !== id));
  };

  const updateEntry = (id: string, field: keyof SalaryEntry, value: string) => {
    setSalaryEntries(salaryEntries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const handleSave = () => {
    setIsLocked(true);
    // 여기에 나중에 서버 저장 로직 추가 가능
  };

  // 일정 추가/수정 함수
  const handleAddSchedule = () => {
    if (selectedDate && newSchedule.title) {
      if (isEditMode && editingSchedule) {
        // 수정 모드: 기존 일정 업데이트
        setSchedules(schedules.map(schedule => 
          schedule.id === editingSchedule.id 
            ? { ...schedule, title: newSchedule.title, description: newSchedule.description }
            : schedule
        ));
      } else {
        // 추가 모드: 새 일정 추가
        const newEntry: ScheduleEntry = {
          id: Date.now().toString(),
          date: selectedDate,
          title: newSchedule.title,
          description: newSchedule.description,
        };
        setSchedules([...schedules, newEntry]);
      }
      handleCloseModal();
    }
  };

  // 모달 닫기 함수
  const handleCloseModal = () => {
    setShowAddModal(false);
    setNewSchedule({ title: '', description: '' });
    setIsEditMode(false);
    setEditingSchedule(null);
  };

  // 일정 클릭 핸들러
  const handleScheduleClick = (schedule: ScheduleEntry) => {
    setSelectedDate(schedule.date);
    setNewSchedule({
      title: schedule.title,
      description: schedule.description,
    });
    setIsEditMode(true);
    setEditingSchedule(schedule);
    setShowAddModal(true);
  };

  // 일정 삭제 함수
  const handleDeleteSchedule = (id: string) => {
    setSchedules(schedules.filter(schedule => schedule.id !== id));
  };

  return (
    <View style={styles.container}>
      {/* 상단 일정 관리 영역 */}
      <View style={styles.scheduleSection}>
        <Text style={styles.sectionTitle}>일정 관리</Text>
        <Calendar
          style={styles.calendar}
          markedDates={markedDates}
          onDayPress={(day: DateData) => {
            setSelectedDate(day.dateString);
            setShowAddModal(true);
          }}
          theme={{
            selectedDayBackgroundColor: COLORS.primary,
            todayTextColor: COLORS.primary,
            arrowColor: COLORS.primary,
          }}
        />

        <ScrollView style={styles.scheduleList}>
          {schedules
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(schedule => (
              <TouchableOpacity
                key={schedule.id}
                style={styles.scheduleItem}
                onPress={() => handleScheduleClick(schedule)}
              >
                <View style={styles.scheduleContent}>
                  <Text style={styles.scheduleDate}>{schedule.date}</Text>
                  <Text style={styles.scheduleTitle}>{schedule.title}</Text>
                  {schedule.description && (
                    <Text style={styles.scheduleDescription}>{schedule.description}</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();  // 상위 onPress 이벤트 전파 방지
                    handleDeleteSchedule(schedule.id);
                  }}
                  style={styles.deleteButton}
                >
                  <Ionicons name="close-circle" size={24} color="red" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
        </ScrollView>

        {/* 일정 추가/수정 모달 */}
        <Modal
          visible={showAddModal}
          transparent
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {isEditMode ? '일정 수정' : '일정 추가'}
              </Text>
              <Text style={styles.modalDate}>{selectedDate}</Text>
              
              <TextInput
                style={styles.input}
                placeholder="일정 제목"
                value={newSchedule.title}
                onChangeText={(text) => setNewSchedule(prev => ({ ...prev, title: text }))}
              />
              
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="상세 내용"
                value={newSchedule.description}
                onChangeText={(text) => setNewSchedule(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handleCloseModal}
                >
                  <Text style={styles.buttonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleAddSchedule}
                >
                  <Text style={styles.buttonText}>
                    {isEditMode ? '수정' : '추가'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>

      {/* 하단 급여 관리 영역 */}
      <View style={styles.salarySection}>
        <View style={styles.salaryHeader}>
          <Text style={styles.sectionTitle}>급여 관리</Text>
          {!isLocked && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={addNewEntry}
            >
              <Ionicons name="add-circle" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.salaryList}>
          {salaryEntries.map((entry) => (
            <View key={entry.id} style={[
              styles.salaryEntry,
              isLocked && styles.lockedEntry
            ]}>
              <TouchableOpacity 
                style={styles.dateSelector}
                onPress={() => !isLocked && setShowYearPicker(entry.id)}
                disabled={isLocked}
              >
                <Text>{entry.year}년</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.dateSelector}
                onPress={() => !isLocked && setShowMonthPicker(entry.id)}
                disabled={isLocked}
              >
                <Text>{entry.month}월</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.amountInput}
                value={entry.amount}
                onChangeText={(value) => updateEntry(entry.id, 'amount', value)}
                placeholder="급여 입력"
                keyboardType="numeric"
                editable={!isLocked}
              />

              {!isLocked && (
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeEntry(entry.id)}
                >
                  <Ionicons name="remove-circle" size={24} color="red" />
                </TouchableOpacity>
              )}

              {showYearPicker === entry.id && (
                <View style={styles.picker}>
                  <ScrollView>
                    {years.map((year) => (
                      <TouchableOpacity
                        key={year}
                        style={styles.pickerItem}
                        onPress={() => {
                          updateEntry(entry.id, 'year', year);
                          setShowYearPicker(null);
                        }}
                      >
                        <Text>{year}년</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {showMonthPicker === entry.id && (
                <View style={styles.picker}>
                  <ScrollView>
                    {months.map((month) => (
                      <TouchableOpacity
                        key={month}
                        style={styles.pickerItem}
                        onPress={() => {
                          updateEntry(entry.id, 'month', month);
                          setShowMonthPicker(null);
                        }}
                      >
                        <Text>{month}월</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {!isLocked && salaryEntries.length > 0 && (
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>저장하기</Text>
          </TouchableOpacity>
        )}

        {isLocked && (
          <TouchableOpacity 
            style={styles.unlockButton}
            onPress={() => setIsLocked(false)}
          >
            <Text style={styles.unlockButtonText}>수정하기</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scheduleSection: {
    flex: 1,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  salarySection: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: COLORS.text,
  },
  salaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addButton: {
    padding: 5,
  },
  salaryList: {
    flex: 1,
  },
  salaryEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateSelector: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    marginRight: 10,
  },
  removeButton: {
    padding: 5,
  },
  picker: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    maxHeight: 200,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1000,
  },
  pickerItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  lockedEntry: {
    opacity: 0.8,
    backgroundColor: '#f8f8f8',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  unlockButton: {
    backgroundColor: '#666',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  unlockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  calendar: {
    marginBottom: 20,
    borderRadius: 10,
    elevation: 2,
    backgroundColor: '#fff',
  },
  scheduleList: {
    flex: 1,
    marginTop: 10,
  },
  scheduleItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    alignItems: 'center',
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleDate: {
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: 5,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  scheduleDescription: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    padding: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalDate: {
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ScheduleScreen; 