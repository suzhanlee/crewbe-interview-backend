import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { COLORS } from '../../utils/constants';
import Button from '../../components/common/Button';
import { useSchedules } from '../../contexts/ScheduleContext';

const HomeScreen = () => {
  const { schedules } = useSchedules();
  const today = new Date().toISOString().split('T')[0];
  const upcomingSchedules = schedules
    .filter(schedule => schedule.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>안녕하세요!</Text>
        <Text style={styles.subtitle}>오늘도 승무원의 꿈을 향해</Text>
      </View>
      
      <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>승무원 이미지</Text>
        </View>
      </View>

      <View style={styles.scheduleContainer}>
        <Text style={styles.scheduleTitle}>다가오는 일정</Text>
        {upcomingSchedules.length > 0 ? (
          upcomingSchedules.map(schedule => (
            <View key={schedule.id} style={styles.scheduleItem}>
              <Text style={styles.scheduleDate}>{schedule.date}</Text>
              <Text style={styles.scheduleItemTitle}>{schedule.title}</Text>
              {schedule.description && (
                <Text style={styles.scheduleDescription} numberOfLines={2}>
                  {schedule.description}
                </Text>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptySchedule}>
            <Text style={styles.emptyText}>등록된 일정이 없습니다</Text>
            <Text style={styles.emptySubText}>일정 관리 탭에서 일정을 추가해보세요!</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.background,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.background,
    opacity: 0.8,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#F0F0F0',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: COLORS.gray,
    fontSize: 16,
  },
  scheduleContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: COLORS.text,
  },
  scheduleItem: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  scheduleDate: {
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: 5,
  },
  scheduleItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
    color: COLORS.text,
  },
  scheduleDescription: {
    fontSize: 14,
    color: '#666',
  },
  emptySchedule: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
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
});

export default HomeScreen; 