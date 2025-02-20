import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../utils/constants';
import Button from '../../components/common/Button';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>홈 화면</Text>
      <Button 
        title="테스트 버튼" 
        onPress={() => alert('버튼이 눌렸습니다!')} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  title: {
    fontSize: 24,
    color: COLORS.text,
    fontWeight: 'bold',
  },
});

export default HomeScreen; 