import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { COLORS } from '../../utils/constants';
import { Ionicons } from '@expo/vector-icons';

interface SalaryEntry {
  id: string;
  year: string;
  month: string;
  amount: string;
}

const ScheduleScreen = () => {
  const [salaryEntries, setSalaryEntries] = useState<SalaryEntry[]>([]);
  const [showYearPicker, setShowYearPicker] = useState<string | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - 5 + i).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

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

  return (
    <View style={styles.container}>
      {/* 상단 일정 관리 영역 */}
      <View style={styles.scheduleSection}>
        <Text style={styles.sectionTitle}>일정 관리</Text>
        {/* 기존 일정 관리 컴포넌트 */}
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
});

export default ScheduleScreen; 