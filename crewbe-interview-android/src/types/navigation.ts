import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  UserNameInput: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
};

export type MainTabParamList = {
  Home: undefined;
  Profile: undefined;
  Schedule: undefined;
  MockInterview: undefined;
};

export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export type UserNameInputScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UserNameInput'>;
export type MockInterviewScreenNavigationProp = NativeStackNavigationProp<MainTabParamList, 'MockInterview'>; 