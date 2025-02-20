import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  UserNameInput: undefined;
  MainTabs: { screen: keyof TabParamList };
};

export type TabParamList = {
  Home: undefined;
  MockInterview: undefined;
  Schedule: undefined;
  Profile: undefined;
};

export type UserNameInputScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UserNameInput'>;
export type MockInterviewScreenNavigationProp = NativeStackNavigationProp<TabParamList, 'MockInterview'>; 