import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { COLORS } from '../../utils/constants';
import Button from '../../components/common/Button';
import { useUser } from '../../contexts/UserContext';
import { useNavigation } from '@react-navigation/native';

const UserNameInputScreen = () => {
  const [inputName, setInputName] = useState('');
  const { setUsername } = useUser();
  const navigation = useNavigation();

  const handleSubmit = () => {
    if (inputName.trim()) {
      setUsername(inputName.trim());
      navigation.navigate('MainTabs', { screen: 'Home' });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>환영합니다!</Text>
      <Text style={styles.subtitle}>사용하실 이름을 입력해주세요</Text>
      
      <TextInput
        style={styles.input}
        value={inputName}
        onChangeText={setInputName}
        placeholder="이름을 입력하세요"
        autoFocus
      />
      
      <Button 
        title="시작하기"
        onPress={handleSubmit}
        disabled={!inputName.trim()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
  },
});

export default UserNameInputScreen; 